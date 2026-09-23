/* seller money is held until delivery, and given back if the order is cancelled */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

let wallet = { pending: 0, balance: 0 };
let userWallet = 0;
let stock = { offer: 10 };

const stubs = {
  [path.resolve(__dirname, "../models/walletTransaction.js")]: { findOne: () => ({ lean: async () => null }), create: async () => ({}) },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => 0, spendFromWallet: async (u, o, a) => a, refundToWallet: async (u, o, a) => { userWallet += a; return a; } },
  mongoose: { Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
  [path.resolve(__dirname, "../models/coupon.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [path.resolve(__dirname, "../models/listing.js")]: { updateOne: async () => ({ modifiedCount: 1 }) },
  [path.resolve(__dirname, "../models/offerSeller.js")]: {
    updateOne: async (f, u) => { stock.offer += u.$inc.stock; return { modifiedCount: 1 }; },
  },
  [path.resolve(__dirname, "../models/store.js")]: {
    updateOne: async (f, u) => {
      wallet.pending += u.$inc["wallet.pending"] || 0;
      wallet.balance += u.$inc["wallet.balance"] || 0;
      return { modifiedCount: 1 };
    },
  },
  [path.resolve(__dirname, "../models/user.js")]: {
    updateOne: async (f, u) => { userWallet += u.$inc["wallet.balance"] || 0; return { modifiedCount: 1 }; },
  },
  [path.resolve(__dirname, "../models/order.js")]: { find: () => ({ limit: async () => [] }) },
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
const { finalizeOrder, releaseOrderFunds, revertOrder } = require("../services/shared/order");

const makeOrder = () => ({
  _id: "o1", user: "u1", paymentStatus: "pending", pricing: { total: 100 }, coupon: null, couponCounted: false, status: "created",
  fundsReleasedAt: null, revertedAt: null,
  items: [{ productId: "p1", offer: "of1", quantity: 2, finalPrice: 50, store: "s1",
            stockReserved: false, walletCredited: false, walletReleased: false }],
  save: async () => {},
});

test("payment holds the money instead of paying the seller", async () => {
  wallet = { pending: 0, balance: 0 };
  const o = makeOrder();
  await finalizeOrder(o);
  assert.deepEqual(wallet, { pending: 100, balance: 0 });
});

test("delivery moves the held money to the withdrawable balance", async () => {
  wallet = { pending: 0, balance: 0 };
  const o = makeOrder();
  await finalizeOrder(o);
  await releaseOrderFunds(o);
  assert.deepEqual(wallet, { pending: 0, balance: 100 });

  await releaseOrderFunds(o);              // again → no change
  assert.deepEqual(wallet, { pending: 0, balance: 100 });
});

test("cancelling before delivery gives back stock, money and coupon", async () => {
  wallet = { pending: 0, balance: 0 }; stock = { offer: 10 };
  const o = makeOrder();
  await finalizeOrder(o);
  assert.equal(stock.offer, 8);
  assert.equal(wallet.pending, 100);

  await revertOrder(o);
  assert.deepEqual(wallet, { pending: 0, balance: 0 });
  assert.equal(stock.offer, 10);

  await revertOrder(o);                    // again → no change
  assert.equal(stock.offer, 10);
});

test("money already released is not taken back by a later cancel", async () => {
  wallet = { pending: 0, balance: 0 }; stock = { offer: 10 };
  const o = makeOrder();
  await finalizeOrder(o);
  await releaseOrderFunds(o);
  await revertOrder(o);
  assert.equal(wallet.balance, 100);
});

/* refund + auto-complete */
test("cancelling a paid order refunds the buyer's wallet", async () => {
  wallet = { pending: 0, balance: 0 }; stock = { offer: 10 }; userWallet = 0;
  const o = makeOrder();
  o.paymentStatus = "paid";
  o.pricing = { total: 100 };
  await finalizeOrder(o);
  await revertOrder(o);

  assert.equal(userWallet, 100);            // money back to the buyer
  assert.equal(o.paymentStatus, "refunded");
  assert.equal(o.refundAmount, 100);
  assert.equal(wallet.pending, 0);          // taken back from the seller
});

test("an unpaid order that is cancelled refunds nothing", async () => {
  userWallet = 0;
  const o = makeOrder();
  o.paymentStatus = "pending";
  await revertOrder(o);
  assert.equal(userWallet, 0);
  assert.equal(o.paymentStatus, "pending");
});
