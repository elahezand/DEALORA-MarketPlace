/* shipped orders the buyer never confirms are completed automatically */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

process.env.ORDER_AUTO_COMPLETE_DAYS = "7";

let found = [];
let lastQuery = null;
const wallet = { pending: 100, balance: 0 };

const stubs = {
  [path.resolve(__dirname, "../models/walletTransaction.js")]: { findOne: () => ({ lean: async () => null }), create: async () => ({}) },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => 0, spendFromWallet: async (u, o, a) => a, refundToWallet: async () => 0, refundPartToWallet: async () => 0 },
  mongoose: { Types: { ObjectId: class {} } },
  [path.resolve(__dirname, "../models/order.js")]: {
    find: (q) => { lastQuery = q; return { limit: async () => found }; },
    updateOne: async () => ({ modifiedCount: 1 }),
  },
  [path.resolve(__dirname, "../models/store.js")]: {
    updateOne: async (f, u) => {
      wallet.pending += u.$inc["wallet.pending"] || 0;
      wallet.balance += u.$inc["wallet.balance"] || 0;
      return { modifiedCount: 1 };
    },
  },
  [path.resolve(__dirname, "../models/user.js")]: { updateOne: async () => ({}) },
  [path.resolve(__dirname, "../models/listing.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [path.resolve(__dirname, "../models/coupon.js")]: { updateOne: async () => ({}) },
  [path.resolve(__dirname, "../utils/helper.js")]: { escapeRegex: (x) => x, paginate: async () => ({}) },
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {}, info() {} },
  [path.resolve(__dirname, "../utils/notify.js")]: async () => {},
  [path.resolve(__dirname, "../services/shared/zarinpal.js")]: { verifyPayment: async () => ({}) },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubs[request]) return stubs[request];
  try {
    const r = Module._resolveFilename(request, parent, isMain);
    if (stubs[r]) return stubs[r];
  } catch (_) {}
  return origLoad.apply(this, arguments);
};
const { autoCompleteShippedOrders } = require("../services/shared/orderSweeper");

const DAY = 24 * 60 * 60 * 1000;
const shippedItem = (extra = {}) => ({
  _id: `i${Math.random()}`, store: "s1", finalPrice: 50, quantity: 2,
  walletCredited: true, walletReleased: false, deliveredAt: null, cancelledAt: null,
  fulfillment: { status: "shipped", shippedAt: new Date(Date.now() - 10 * DAY), estimatedDeliveryAt: null },
  ...extra,
});
const makeOrder = (items, extra = {}) => ({
  _id: "o1", status: "shipped", paymentMethod: "zarinpal", paymentStatus: "paid",
  deliveredAt: null, autoCompletedAt: null, fundsReleasedAt: null, items,
  save: async () => {}, markModified() {}, ...extra,
});

test("orders with a part shipped more than 7 days ago are picked (paid, or cash)", async () => {
  found = [];
  await autoCompleteShippedOrders();
  assert.deepEqual(lastQuery.status, { $in: ["processing", "shipped"] });
  const shippedBefore = lastQuery.items.$elemMatch["fulfillment.shippedAt"].$lte.getTime();
  const days = (Date.now() - shippedBefore) / DAY;
  assert.ok(days > 6.9 && days < 7.1);
});

test("a forgotten order is completed and the seller is paid", async () => {
  wallet.pending = 100; wallet.balance = 0;
  const order = makeOrder([shippedItem()]);
  found = [order];

  const count = await autoCompleteShippedOrders();
  assert.equal(count, 1);
  assert.equal(order.status, "completed");
  assert.equal(order.isDelivered, true);
  assert.ok(order.autoCompletedAt);
  assert.deepEqual(wallet, { pending: 0, balance: 100 });
});

test("store A is paid on time even while store B hasn't shipped", async () => {
  wallet.pending = 100; wallet.balance = 0;
  const a = shippedItem({ store: "storeA" });
  const b = shippedItem({ store: "storeB", walletCredited: true, fulfillment: { status: "pending" } });
  const order = makeOrder([a, b], { status: "processing" });
  found = [order];

  assert.equal(await autoCompleteShippedOrders(), 1);
  assert.ok(a.deliveredAt);                   // A's part is done, A is paid
  assert.equal(b.deliveredAt, null);           // B still open
  assert.equal(order.status, "processing");    // so the order isn't completed yet
  assert.deepEqual(wallet, { pending: 0, balance: 100 });
});

test("a part waits for its delivery time + 7 days, not only the ship date", async () => {
  const late = shippedItem({ fulfillment: { status: "shipped", shippedAt: new Date(Date.now() - 10 * DAY), estimatedDeliveryAt: new Date(Date.now() - 2 * DAY) } });
  found = [makeOrder([late])];
  assert.equal(await autoCompleteShippedOrders(), 0);
  assert.equal(late.deliveredAt, null);
});

test("a cash part is never auto-completed before its cash is confirmed", async () => {
  const unpaid = shippedItem({ cashCollectedAt: null });
  found = [makeOrder([unpaid], { paymentMethod: "cash", paymentStatus: "pending" })];
  assert.equal(await autoCompleteShippedOrders(), 0);

  const paid = shippedItem({ cashCollectedAt: new Date(), walletCredited: true, walletReleased: true });
  const order = makeOrder([paid], { paymentMethod: "cash", paymentStatus: "paid" });
  found = [order];
  assert.equal(await autoCompleteShippedOrders(), 1);
  assert.equal(order.status, "completed");
});

test("an unpaid order can't be completed", async () => {
  const { completeDeliveredOrder } = require("../services/shared/order");
  const cash = makeOrder([shippedItem()], { paymentMethod: "cash", paymentStatus: "pending" });
  await assert.rejects(() => completeDeliveredOrder(cash), /aren't paid yet/);
  assert.equal(cash.status, "shipped");
});
