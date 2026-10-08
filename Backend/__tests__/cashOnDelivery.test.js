/* cash on delivery: a store's cash goes straight to the store; whoever got the cash confirms it */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const r = (p) => path.resolve(__dirname, "..", p);
const storeIncs = [];

const stubs = {
  mongoose: { Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
  [r("models/order.js")]: {},
  [r("models/listing.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [r("models/offerSeller.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [r("models/coupon.js")]: { updateOne: async () => ({}) },
  [r("models/store.js")]: { updateOne: async (f, u) => { storeIncs.push(u.$inc); return {}; } },
  [r("services/shared/wallet.js")]: { refundToWallet: async () => 0 },
  [r("utils/helper.js")]: { escapeRegex: (s) => s },
  [r("utils/logger.js")]: { warn() {}, error() {}, info() {} },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubs[request]) return stubs[request];
  try {
    const resolved = Module._resolveFilename(request, parent, isMain);
    if (stubs[resolved]) return stubs[resolved];
  } catch (_) {}
  return origLoad.apply(this, arguments);
};

const shared = require("../services/shared/order");

const item = (extra = {}) => ({
  productId: "p", variantId: null, offer: "of1", quantity: 2, finalPrice: 50,
  stockReserved: true, walletCredited: false, walletReleased: false,
  fulfillment: { status: "shipped" }, ...extra,
});
const order = (extra = {}) => ({
  _id: "o1", user: "u1", status: "shipped", paymentMethod: "cash", paymentStatus: "pending",
  pricing: { total: 100, walletUsed: 0 }, markModified() {}, save: async function () { return this; },
  ...extra,
});

test("finalizing a CASH order does not put the store's money in its site wallet", async () => {
  storeIncs.length = 0;
  const o = order({ status: "created", items: [item({ store: "s1" })] });
  await shared.finalizeOrder(o);
  assert.equal(storeIncs.length, 0);                 // nothing credited — the store got the cash itself
  assert.equal(o.items[0].paidDirectToStore, true);
  assert.equal(o.items[0].walletCredited, true);     // step counted as done (sweeper won't retry it)
  assert.equal(o.items[0].walletReleased, true);     // and completing it releases nothing
});

test("an ONLINE order still holds the store's money in its wallet", async () => {
  storeIncs.length = 0;
  const o = order({ status: "created", paymentMethod: "zarinpal", paymentStatus: "paid", items: [item({ store: "s1" })] });
  await shared.finalizeOrder(o);
  assert.deepEqual(storeIncs, [{ "wallet.pending": 100 }]);
  assert.notEqual(o.items[0].paidDirectToStore, true);
});

test("completing a cash order releases nothing to the store", async () => {
  storeIncs.length = 0;
  const o = order({ items: [item({ store: "s1", walletCredited: true, walletReleased: true, paidDirectToStore: true })] });
  await shared.completeDeliveredOrder(o);
  assert.equal(o.status, "completed");
  assert.equal(o.paymentStatus, "paid");
  assert.equal(storeIncs.length, 0);
});

test("cancelling a cash order takes nothing from the store's wallet", async () => {
  storeIncs.length = 0;
  const o = order({ status: "processing", items: [item({ store: "s1", walletCredited: true, walletReleased: true, paidDirectToStore: true })] });
  await shared.revertOrder(o);
  assert.ok(!storeIncs.some((inc) => inc && "wallet.pending" in inc));
});

test("confirming all the cash makes the order PAID; it then completes like an online order", async () => {
  const mine = item({ store: "s1" });
  const site = item({ store: null });
  const o = order({ items: [mine, site] });

  const first = await shared.markCashCollected(o, [mine], "seller1");
  assert.equal(first.paid, false);                   // the site's item is still open
  assert.equal(o.paymentStatus, "pending");
  assert.ok(mine.cashCollectedAt);
  assert.equal(mine.cashCollectedBy, "seller1");

  const second = await shared.markCashCollected(o, [site], "admin1");
  assert.equal(second.paid, true);
  assert.equal(second.completed, false);             // waits for the buyer or the auto-complete
  assert.equal(o.paymentStatus, "paid");
  assert.equal(o.status, "shipped");
});

test("cash confirmed after the buyer already confirmed receipt → completed right away", async () => {
  const mine = item({ store: "s1" });
  const o = order({ items: [mine], buyerConfirmedAt: new Date() });
  const res = await shared.markCashCollected(o, [mine], "seller1");
  assert.equal(res.completed, true);
  assert.equal(o.status, "completed");
  assert.equal(o.paymentStatus, "paid");
});

test("'not received' when the buyer never confirmed and no cash was confirmed → cancelled", async () => {
  const mine = item({ store: "s1" });
  const o = order({ items: [mine] });
  const res = await shared.reportCashNotReceived(o, [mine], "seller1", "refused at the door");
  assert.equal(res.outcome, "cancelled");
  assert.equal(o.status, "cancelled");
  assert.equal(o.cashDispute.note, "refused at the door");
  assert.equal(mine.stockReserved, false);           // stock went back
});

test("'not received' but the buyer says they got it → a dispute for the admins, nothing cancelled", async () => {
  const mine = item({ store: "s1" });
  const o = order({ items: [mine], buyerConfirmedAt: new Date() });
  const res = await shared.reportCashNotReceived(o, [mine], "seller1");
  assert.equal(res.outcome, "disputed");
  assert.equal(o.status, "shipped");
  assert.ok(o.cashDispute.reportedAt);
  await assert.rejects(() => shared.reportCashNotReceived(o, [mine], "seller1"), /already reported/);
});

test("'not received' when part of the cash was already confirmed → dispute (no partial cancel)", async () => {
  const mine = item({ store: "s1" });
  const site = item({ store: null, cashCollectedAt: new Date() });
  const o = order({ items: [mine, site] });
  const res = await shared.reportCashNotReceived(o, [mine], "seller1");
  assert.equal(res.outcome, "disputed");
  assert.equal(o.status, "shipped");
});

test("cash can't be confirmed twice, before shipping, or on an online order", async () => {
  const done = item({ store: "s1", cashCollectedAt: new Date() });
  await assert.rejects(() => shared.markCashCollected(order({ items: [done] }), [done], "x"), /already confirmed/);

  const notShipped = item({ store: "s1", fulfillment: { status: "pending" } });
  await assert.rejects(
    () => shared.markCashCollected(order({ status: "processing", items: [notShipped] }), [notShipped], "x"),
    /Ship the items first/
  );

  const online = item({ store: "s1" });
  await assert.rejects(
    () => shared.markCashCollected(order({ paymentMethod: "zarinpal", items: [online] }), [online], "x"),
    /wasn't paid in cash/
  );
});
