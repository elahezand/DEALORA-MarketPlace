/* buyer cancels one item that hasn't been shipped yet */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const r = (p) => path.resolve(__dirname, "..", p);
let current = null;
let cancelled = [];
let notices = [];

const stubs = {
  [r("models/order.js")]: { findOne: async () => current },
  [r("models/cart.js")]: {},
  [r("models/user.js")]: {},
  [r("models/store.js")]: {
    findById: () => ({ select: () => ({ lean: async () => ({ owner: "seller1" }) }) }),
  },
  [r("services/shared/wallet.js")]: { spendFromWallet: async () => 0 },
  [r("services/shared/zarinpal.js")]: { createPayment: async () => null },
  [r("services/shared/order.js")]: {
    cancelItems: async (order, items) => {
      cancelled.push(...items.map((item) => item._id));
      for (const item of items) item.cancelledAt = new Date();
      return 40;
    },
  },
  [r("utils/helper.js")]: {},
  [r("utils/listQuery.js")]: {},
  [r("utils/notify.js")]: async (userId, msg) => { notices.push({ userId, msg }); },
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

const { cancelMyItem } = require("../services/user/order");

const makeOrder = (status, items) => {
  const order = { _id: "507f1f77bcf86cd799439011", user: "u1", status, items };
  order.items.id = (id) => items.find((item) => item._id === id);
  return order;
};
const item = (id, shipped, store = "A") => ({
  _id: id, store, productSnapshot: { title: `item ${id}` },
  fulfillment: { status: shipped ? "shipped" : "pending" },
});
const reset = (order) => { current = order; cancelled = []; notices = []; };

test("an item that wasn't shipped is cancelled and its store is told", async () => {
  reset(makeOrder("processing", [item("i1", true), item("i2", false, "B")]));
  const { refund } = await cancelMyItem("o", "u1", "i2");
  assert.equal(refund, 40);
  assert.deepEqual(cancelled, ["i2"]);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].userId, "seller1");
});

test("a shipped item can't be cancelled by the buyer", async () => {
  reset(makeOrder("processing", [item("i1", true), item("i2", false)]));
  await assert.rejects(cancelMyItem("o", "u1", "i1"), /already been shipped/);
  assert.deepEqual(cancelled, []);
});

test("an unpaid online order (created) can't drop single items", async () => {
  reset(makeOrder("created", [item("i1", false), item("i2", false)]));
  await assert.rejects(cancelMyItem("o", "u1", "i1"), /one by one/);
});

test("an item that's already cancelled gives 404", async () => {
  const order = makeOrder("processing", [item("i1", false), item("i2", false)]);
  order.items[0].cancelledAt = new Date();
  reset(order);
  await assert.rejects(cancelMyItem("o", "u1", "i1"), /already cancelled/);
});

test("site items cancel without a store notice", async () => {
  reset(makeOrder("processing", [item("i1", false, null), item("i2", false)]));
  await cancelMyItem("o", "u1", "i1");
  assert.deepEqual(cancelled, ["i1"]);
  assert.equal(notices.length, 0);
});
