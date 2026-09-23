/* finalizeOrder continues after a crash and never repeats a finished step */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const calls = { coupon: 0, offerStock: 0, variantStock: 0, wallet: 0, sold: 0 };
let failNextStock = false;

const stubs = {
  [path.resolve(__dirname, "../models/walletTransaction.js")]: { findOne: () => ({ lean: async () => null }), create: async () => ({}) },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => 0, spendFromWallet: async (u, o, a) => a, refundToWallet: async () => 0 },
  mongoose: { Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
  [path.resolve(__dirname, "../models/order.js")]: { find: () => ({ limit: async () => [] }) },
  [path.resolve(__dirname, "../models/user.js")]: { updateOne: async () => ({}) },
  [path.resolve(__dirname, "../models/coupon.js")]: { updateOne: async () => { calls.coupon++; return { modifiedCount: 1 }; } },
  [path.resolve(__dirname, "../models/listing.js")]: {
    updateOne: async (f, u) => {
      if (u.$inc && u.$inc["variants.$[elem].stock"]) { calls.variantStock++; return { modifiedCount: failNextStock ? 0 : 1 }; }
      calls.sold++; return { modifiedCount: 1 };
    },
  },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { updateOne: async () => { calls.offerStock++; return { modifiedCount: 1 }; } },
  [path.resolve(__dirname, "../models/store.js")]: { updateOne: async () => { calls.wallet++; return { modifiedCount: 1 }; } },
  [path.resolve(__dirname, "../utils/helper.js")]: { escapeRegex: (x) => x, paginate: async () => ({}) },
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {}, info() {} },
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
const { finalizeOrder } = require("../services/shared/order");

const makeOrder = () => ({
  _id: "o1",
  coupon: { couponId: "c1" },
  couponCounted: false,
  status: "created",
  items: [
    { productId: "p1", offer: "of1", quantity: 2, finalPrice: 10, store: "s1", stockReserved: false, walletCredited: false },
    { productId: "p2", variantId: "v2", quantity: 1, finalPrice: 20, store: null, stockReserved: false, walletCredited: false },
  ],
  save: async () => {},
});

test("first run does every step once", async () => {
  const o = makeOrder();
  await finalizeOrder(o);
  assert.deepEqual(calls, { coupon: 1, offerStock: 1, variantStock: 1, wallet: 1, sold: 1 });
  assert.equal(o.status, "processing");
  assert.ok(o.couponCounted && o.items.every((i) => i.stockReserved));
});

test("calling it again repeats nothing", async () => {
  const o = makeOrder();
  await finalizeOrder(o);
  const before = { ...calls };
  await finalizeOrder(o);
  assert.deepEqual(calls, before);
});

test("a crash after the coupon step leaves the rest to the next run", async () => {
  Object.keys(calls).forEach((k) => (calls[k] = 0));
  const o = makeOrder();
  o.couponCounted = true;           // coupon already counted before the crash
  await finalizeOrder(o);
  assert.equal(calls.coupon, 0);    // not counted twice
  assert.equal(calls.wallet, 1);    // the seller still gets paid
});

test("stock that can't be reserved is marked and logged, not retried forever", async () => {
  Object.keys(calls).forEach((k) => (calls[k] = 0));
  failNextStock = true;
  const o = makeOrder();
  await finalizeOrder(o);
  failNextStock = false;
  assert.ok(o.items.every((i) => i.stockReserved));
  const before = { ...calls };
  await finalizeOrder(o);
  assert.deepEqual(calls, before);
});
