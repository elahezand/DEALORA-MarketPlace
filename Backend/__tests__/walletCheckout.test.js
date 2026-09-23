/* paying with the wallet balance */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

let userBalance = 0;
let created = null;
let finalizeCalls = 0;
let paymentCalls = 0;
let cartStatus = [];

const chain = (v) => ({ select() { return this; }, populate: async () => v, lean: async () => v, then: (r) => r(v) });

const stubs = {
  [path.resolve(__dirname, "../models/walletTransaction.js")]: { findOne: () => ({ lean: async () => null }), create: async () => ({}) },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: {
    walletSpentOn: async () => 0,
    spendFromWallet: async (u, o, amount) => { if (userBalance < amount) return 0; userBalance -= amount; return amount; },
    refundToWallet: async (u, o, amount) => { userBalance += amount; return amount; },
  },
  mongoose: { Types: { ObjectId: class {} } },
  [path.resolve(__dirname, "../models/cart.js")]: {
    findOneAndUpdate: () => ({ populate: async () => ({ _id: "c1", user: "u1", items: [{}], coupon: null, shippingCost: 0 }) }),
    updateOne: async (f, u) => { cartStatus.push(u.$set.status); return {}; },
  },
  [path.resolve(__dirname, "../models/order.js")]: {
    findOne: async () => null,
    create: async (d) => (created = { ...d, save: async () => created }),
  },
  [path.resolve(__dirname, "../models/user.js")]: {
    findById: () => chain({ wallet: { balance: userBalance } }),
    findOneAndUpdate: async (f, u) => {
      const need = -u.$inc["wallet.balance"];
      if (userBalance < need) return null;
      userBalance -= need;
      return { _id: "u1" };
    },
    updateOne: async (f, u) => { userBalance += u.$inc["wallet.balance"] || 0; return {}; },
  },
  [path.resolve(__dirname, "../utils/helper.js")]: {
    paginate: async () => ({}),
    getCouponProblem: () => null,
    calculateCartTotals: async () => ({
      items: [{ productId: "p1", quantity: 1, price: 100, discount: 0, finalPrice: 100, store: null,
                productInfo: { title: "x", images: ["/i.jpg"], slug: "x" }, variantSnapshot: null, listingType: "store_product" }],
      skippedItems: [],
      pricing: { subtotal: 100, discount: 0, shippingCost: 0, total: 100 },
    }),
  },
  [path.resolve(__dirname, "../services/shared/zarinpal.js")]: {
    createPayment: async () => { paymentCalls++; return { data: { authority: "A1" } }; },
  },
  [path.resolve(__dirname, "../services/shared/order.js")]: {
    buildOrderIdSearchExpr: () => null,
    finalizeOrder: async () => { finalizeCalls++; },
    releaseOrderFunds: async () => {},
    revertOrder: async () => {},
  },
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
const { checkout } = require("../services/user/order");
const address = { name: "x" };

test("a wallet that covers the whole order skips the gateway", async () => {
  userBalance = 150; finalizeCalls = 0; paymentCalls = 0;
  const { order, paymentUrl } = await checkout("u1", address, "zarinpal", null, true);

  assert.equal(order.pricing.walletUsed, 100);
  assert.equal(order.pricing.total, 0);
  assert.equal(order.paymentStatus, "paid");
  assert.equal(paymentUrl, null);
  assert.equal(paymentCalls, 0);   // no gateway call
  assert.equal(finalizeCalls, 1);  // stock reserved right away
  assert.equal(userBalance, 50);
});

test("a partial wallet pays the rest through the gateway", async () => {
  userBalance = 30; finalizeCalls = 0; paymentCalls = 0;
  const { order, paymentUrl } = await checkout("u1", address, "zarinpal", null, true);

  assert.equal(order.pricing.walletUsed, 30);
  assert.equal(order.pricing.total, 70);
  assert.equal(paymentCalls, 1);
  assert.ok(paymentUrl.endsWith("A1"));
  assert.equal(userBalance, 0);
});

test("without useWallet the balance is untouched", async () => {
  userBalance = 500;
  const { order } = await checkout("u1", address, "zarinpal", null, false);
  assert.equal(order.pricing.walletUsed, 0);
  assert.equal(order.pricing.total, 100);
  assert.equal(userBalance, 500);
});
