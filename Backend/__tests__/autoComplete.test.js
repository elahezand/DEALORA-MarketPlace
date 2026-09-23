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
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => 0, spendFromWallet: async (u, o, a) => a, refundToWallet: async () => 0 },
  mongoose: { Types: { ObjectId: class {} } },
  [path.resolve(__dirname, "../models/order.js")]: {
    find: (q) => { lastQuery = q; return { limit: async () => found }; },
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
const { autoCompleteShippedOrders } = require("../services/shared/order");

test("only shipped orders older than the deadline are picked", async () => {
  found = [];
  await autoCompleteShippedOrders();
  assert.equal(lastQuery.status, "shipped");
  const deadline = lastQuery.shippedAt.$lte.getTime();
  const days = (Date.now() - deadline) / (24 * 60 * 60 * 1000);
  assert.ok(days > 6.9 && days < 7.1);
});

test("a forgotten order is completed and the seller is paid", async () => {
  const order = {
    _id: "o1", status: "shipped", deliveredAt: null, autoCompletedAt: null, fundsReleasedAt: null,
    items: [{ store: "s1", finalPrice: 50, quantity: 2, walletCredited: true, walletReleased: false }],
    save: async () => {},
  };
  found = [order];

  const count = await autoCompleteShippedOrders();
  assert.equal(count, 1);
  assert.equal(order.status, "completed");
  assert.equal(order.isDelivered, true);
  assert.ok(order.autoCompletedAt);
  assert.deepEqual(wallet, { pending: 0, balance: 100 });
});
