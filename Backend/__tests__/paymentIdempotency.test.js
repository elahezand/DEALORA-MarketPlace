/* the Zarinpal callback can be called many times — the order is finalized once */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const AUTH = "A123";
let order, finalizeCalls = 0, verifyResult = { success: true, refId: "9" };

const makeOrder = (items) => ({
  _id: "o1", pricing: { total: 100 }, paymentStatus: "pending", finalizedAt: null,
  items: items || [{ stockReserved: false, store: "s1", walletCredited: false }],
  payment: { authority: AUTH }, save: async () => order,
});

const stubs = {
  [path.resolve(__dirname, "../models/walletTransaction.js")]: { findOne: () => ({ lean: async () => null }), create: async () => ({}) },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => 0, spendFromWallet: async (u, o, a) => a, refundToWallet: async () => 0 },
  mongoose: { Types: { ObjectId: class {} }, startSession: async () => ({}) },
  [path.resolve(__dirname, "../models/user.js")]: { findById: () => ({ select: () => ({ lean: async () => ({ wallet: { balance: 0 } }) }) }), findOneAndUpdate: async () => null, updateOne: async () => ({}) },
  [path.resolve(__dirname, "../models/cart.js")]: { findOneAndUpdate: () => ({ populate: async () => null }) },
  [path.resolve(__dirname, "../models/listing.js")]: {},
  [path.resolve(__dirname, "../models/coupon.js")]: {},
  [path.resolve(__dirname, "../models/store.js")]: {},
  [path.resolve(__dirname, "../models/offerSeller.js")]: {},
  [path.resolve(__dirname, "../utils/helper.js")]: { paginate: async () => ({}), escapeRegex: (x) => x, calculateCartTotals: async () => ({ items: [], skippedItems: [], pricing: {} }), getCouponProblem: () => null },
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {}, info() {} },
  [path.resolve(__dirname, "../models/order.js")]: {
    findOne: async () => order,
    // atomic claim: only succeeds while finalizedAt is still null
    findOneAndUpdate: async (filter, update) => {
      if (order.finalizedAt || order.paymentStatus === "paid") return null;
      order.finalizedAt = update.$set.finalizedAt;
      return order;
    },
  },
  [path.resolve(__dirname, "../services/shared/zarinpal.js")]: { verifyPayment: async () => verifyResult },
  [path.resolve(__dirname, "../services/shared/order.js")]: {
    // the real one marks each step; here we just mark everything as done
    finalizeOrder: async (o) => {
      finalizeCalls++;
      o.items.forEach((i) => { i.stockReserved = true; i.walletCredited = true; });
    },
  },
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
const { verify } = require("../services/public/order");

test("two parallel callbacks finalize the order only once", async () => {
  order = makeOrder(); finalizeCalls = 0;
  await Promise.all([verify(AUTH), verify(AUTH)]);
  assert.equal(finalizeCalls, 1);
  assert.equal(order.paymentStatus, "paid");
});

test("refreshing the page later does not finalize again", async () => {
  await verify(AUTH);
  await verify(AUTH);
  assert.equal(finalizeCalls, 1);
});

test("a paid order whose finalize crashed half-way is resumed", async () => {
  order = makeOrder([
    { stockReserved: true, store: "s1", walletCredited: true },   // done
    { stockReserved: true, store: "s2", walletCredited: false },  // seller not paid yet
  ]);
  order.paymentStatus = "paid";
  order.finalizedAt = new Date();
  finalizeCalls = 0;

  await verify(AUTH);
  assert.equal(finalizeCalls, 1);          // continued
  assert.ok(order.items.every((i) => i.walletCredited));

  await verify(AUTH);
  assert.equal(finalizeCalls, 1);          // nothing left to do
});

test("a failed payment releases the claim so the user can retry", async () => {
  order = makeOrder(); finalizeCalls = 0; verifyResult = { success: false };
  const res = await verify(AUTH);
  assert.equal(res.paymentStatus, "failed");
  assert.equal(res.finalizedAt, null);
  assert.equal(finalizeCalls, 0);
  verifyResult = { success: true, refId: "9" };
});

/* checkout: the same idempotency key must never create a second order */
test("checkout with the same key returns the first order", async () => {
  const existing = { _id: "o9", payment: { authority: "A777" } };
  const orderModel = stubs[path.resolve(__dirname, "../models/order.js")];
  orderModel.findOne = async (q) => (q.idempotencyKey === "key-1" ? existing : null);

  const { checkout } = require("../services/user/order");
  const res = await checkout("u1", {}, "zarinpal", "key-1");
  assert.equal(res.order, existing);
  assert.ok(res.paymentUrl.endsWith("A777"));
});
