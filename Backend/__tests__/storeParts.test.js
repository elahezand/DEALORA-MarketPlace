/* each store's part of an order is delivered, paid out and cancelled on its own */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const r = (p) => path.resolve(__dirname, "..", p);
let wallets = {};
let buyerWallet = 0;
const refundKeys = new Set();
const claimed = new Set();
let couponUses = 1;

const stubs = {
  mongoose: { Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
  [r("models/order.js")]: {
    updateOne: async (f) => {
      const id = f.items.$elemMatch._id;
      if (claimed.has(id)) return { modifiedCount: 0 };
      claimed.add(id);
      return { modifiedCount: 1 };
    },
  },
  [r("models/listing.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [r("models/offerSeller.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [r("models/coupon.js")]: { updateOne: async (f, u) => { couponUses += u.$inc.usedCount; return {}; } },
  [r("models/store.js")]: {
    updateOne: async (f, u) => {
      const w = (wallets[f._id] ||= { pending: 0, balance: 0 });
      w.pending += u.$inc["wallet.pending"] || 0;
      w.balance += u.$inc["wallet.balance"] || 0;
      return { modifiedCount: 1 };
    },
  },
  [r("services/shared/wallet.js")]: {
    refundPartToWallet: async (u, o, key, amount) => {
      if (refundKeys.has(key)) return 0;
      refundKeys.add(key);
      buyerWallet += amount;
      return amount;
    },
  },
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

let n = 0;
const item = (store, price, extra = {}) => ({
  _id: `i${++n}`, store, productId: "p", offer: "of", quantity: 1, finalPrice: price,
  stockReserved: true, walletCredited: true, walletReleased: false,
  fulfillment: { status: "shipped", shippedAt: new Date() }, ...extra,
});
const paidOrder = (items) => ({
  _id: `o${++n}`, user: "u1", status: "shipped", paymentMethod: "zarinpal", paymentStatus: "paid",
  pricing: { total: 100, walletUsed: 0 }, coupon: { couponId: "c1" }, couponCounted: true,
  refundAmount: 0, items, markModified() {}, save: async function () { return this; },
});
const reset = () => {
  wallets = { A: { pending: 60, balance: 0 }, B: { pending: 40, balance: 0 } };
  buyerWallet = 0; couponUses = 1;
};

test("cancelling store B's part refunds only B's share and keeps the order going", async () => {
  reset();
  const a = item("A", 60);
  const b = item("B", 40);
  const order = paidOrder([a, b]);

  const refund = await shared.cancelItems(order, [b], "cancelled by admin");
  assert.equal(refund, 40);
  assert.equal(buyerWallet, 40);
  assert.ok(b.cancelledAt);
  assert.equal(wallets.B.pending, 0);          // B's held money dropped
  assert.equal(wallets.A.pending, 60);         // A untouched
  assert.equal(order.status, "shipped");
  assert.equal(couponUses, 1);                 // coupon still used by the rest

  // the last part → the rest of the money, the whole order is cancelled
  await shared.cancelItems(order, [a]);
  assert.equal(buyerWallet, 100);
  assert.equal(order.status, "cancelled");
  assert.equal(order.paymentStatus, "refunded");
  assert.equal(couponUses, 0);
});

test("each part completes on its own; the order completes with the last one", async () => {
  reset();
  const a = item("A", 60);
  const b = item("B", 40);
  const order = paidOrder([a, b]);

  await shared.completeItems(order, [a]);
  assert.deepEqual(wallets.A, { pending: 0, balance: 60 });
  assert.equal(order.status, "shipped");

  await shared.completeItems(order, [b]);
  assert.deepEqual(wallets.B, { pending: 0, balance: 40 });
  assert.equal(order.status, "completed");
});

test("two completions at the same time pay the seller once", async () => {
  reset();
  const a = item("A", 60);
  const order = paidOrder([a]);
  const copy = { ...order, items: [{ ...a }] };   // a second request that read the same order

  await Promise.all([shared.completeItems(order, order.items), shared.completeItems(copy, copy.items)]);
  assert.deepEqual(wallets.A, { pending: 0, balance: 60 });
});

test("a delivered part can't be cancelled, and the whole order can't be reverted then", async () => {
  reset();
  const a = item("A", 60, { deliveredAt: new Date() });
  const b = item("B", 40);
  const order = paidOrder([a, b]);

  await assert.rejects(() => shared.cancelItems(order, [a]), /Delivered items can't be cancelled/);
  await assert.rejects(() => shared.revertOrder(order), /already delivered/);
  assert.equal(buyerWallet, 0);
});
