/* regression tests for the security / money fixes of the audit */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const r = (p) => path.resolve(__dirname, "..", p);
const state = {
  order: null,
  withdrawalUpdate: null,
  storeInc: null,
  storeUpdate: null,
  store: null,
  storeExists: false,
  listing: null,
  userUpdate: null,
  created: null,
};

const lean = (v) => ({ select() { return this; }, lean: async () => v });

const stubs = {
  mongoose: { Types: { ObjectId: Object.assign(class {}, { isValid: () => true }) } },
  [r("models/order.js")]: { findById: async () => state.order },
  [r("models/withdrawal.js")]: {
    findOneAndUpdate: async (filter, update) => {
      if (!state.withdrawalPending) return null;
      state.withdrawalPending = false; // the second click finds nothing
      state.withdrawalUpdate = update;
      return { _id: "w1", store: "s1", amount: 5000, ...update.$set };
    },
    exists: async () => true,
  },
  [r("models/store.js")]: {
    updateOne: async (filter, update) => {
      if (update.$inc) state.storeInc = (state.storeInc || 0) + update.$inc["wallet.balance"];
      else state.storeUpdate = update;
      return {};
    },
    findById: (id) => {
      const doc = state.store;
      const p = Promise.resolve(doc);
      p.lean = async () => doc;
      return p;
    },
    exists: async () => state.storeExists,
    create: async (d) => (state.created = { _id: "newStore", ...d }),
    findByIdAndDelete: async () => {},
  },
  [r("models/user.js")]: {
    findById: async () => ({ _id: "u1" }),
    updateOne: async (f, u) => { state.userUpdate = u; },
  },
  [r("models/offerSeller.js")]: { updateMany: async () => {} },
  [r("models/category.js")]: { findById: () => lean({ parent: null }) },
  [r("models/listing.js")]: {
    findById: async () => state.listing,
  },
  [r("utils/helper.js")]: { paginate: async () => ({}) },
  [r("utils/cache.js")]: async () => {},
  [r("utils/logger.js")]: { warn() {}, error() {}, info() {} },
  [r("services/shared/order.js")]: {
    completeDeliveredOrder: async () => {}, revertOrder: async () => {},
    finalizeOrder: async () => {}, buildOrderIdSearchExpr: () => null,
    maybeMarkOrderShipped: () => {}, markItemShipped: () => {}, assertShippable: () => {},
    refreshExpectedDelivery: () => {}, setItemDeliveryEstimate: () => {},
    markCashCollected: async () => ({}), reportCashNotReceived: async () => ({}),
  },
  [r("services/shared/deliveryNotice.js")]: { notifyItemShipped: async () => {}, notifyDeliveryUpdated: async () => {} },
  [r("services/shared/cashNotice.js")]: { notifyCashNotReceived: async () => {}, notifyAdmins: async () => {} },
  [r("services/shared/listing.js")]: {
    PROTECTED_FIELDS: ["status", "owner", "minPrice", "metrics", "slug", "shortIdentifier", "listingType"],
    buildListingDetail: async (x) => x, findListingForDetail: async () => null,
  },
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

const adminOrder = require("../services/admin/order");
const adminWithdrawal = require("../services/admin/withdrawal");
const sellerStores = require("../services/seller/stores");
const userStores = require("../services/user/stores");
const userListing = require("../services/user/listing");
const { toSlug } = require("../services/shared/stores");

const makeOrder = (extra = {}) => ({
  _id: "o1", status: "completed", paymentStatus: "paid", paymentMethod: "zarinpal",
  save: async function () { return this; }, ...extra,
});

test("admin can't cancel a completed order (seller already paid → double payout)", async () => {
  state.order = makeOrder();
  await assert.rejects(() => adminOrder.updateOrder("o1", { status: "cancelled" }), /can't go from "completed"/);
});

test("admin can't complete an order by hand — only the buyer or the system does", async () => {
  state.order = makeOrder({ status: "shipped", paymentStatus: "paid" });
  await assert.rejects(() => adminOrder.updateOrder("o1", { status: "completed" }), /can't go from "shipped" to "completed"/);
  // but cancelling a shipped order (lost parcel) is still allowed
  state.order = makeOrder({ status: "shipped", paymentStatus: "paid" });
  const o = await adminOrder.updateOrder("o1", { status: "cancelled" });
  assert.equal(o.status, "cancelled");
});

test("admin can't mark a cash order as paid by hand (only whoever got the cash confirms it)", async () => {
  state.order = makeOrder({ status: "shipped", paymentMethod: "cash", paymentStatus: "pending" });
  await assert.rejects(
    () => adminOrder.updateOrder("o1", { status: "shipped", paymentStatus: "paid" }),
    /Payment status can't go from "pending" to "paid"/
  );
});

test("sending the current status back (shipped → shipped) is accepted", async () => {
  state.order = makeOrder({ status: "shipped", paymentMethod: "zarinpal", paymentStatus: "pending" });
  const o = await adminOrder.updateOrder("o1", { status: "shipped", paymentStatus: "failed" });
  assert.equal(o.paymentStatus, "failed");
});

test("rejecting a withdrawal twice refunds the store only once", async () => {
  state.withdrawalPending = true;
  state.storeInc = 0;
  await adminWithdrawal.processWithdrawal("w1", "admin", { status: "rejected", rejectReason: "bad iban" });
  await assert.rejects(
    () => adminWithdrawal.processWithdrawal("w1", "admin", { status: "rejected", rejectReason: "bad iban" }),
    /already been finalized/
  );
  assert.equal(state.storeInc, 5000);
});

test("a seller can't verify their own store or change its owner / wallet / ratings", async () => {
  state.store = { _id: "s1", owner: "u1", name: "Shop" };
  await sellerStores.updateStore("u1", "s1", {
    name: "New name", isVerified: true, owner: "someone-else", wallet: { balance: 1e9 }, meta: { ratings: 5 },
  });
  const set = state.storeUpdate.$set;
  assert.equal(set.name, "New name");
  assert.equal(set.isVerified, undefined);
  assert.equal(set.owner, undefined);
  assert.equal(set.wallet, undefined);
  assert.equal(set.meta, undefined);
});

test("a store holding money can't be deleted", async () => {
  state.store = { _id: "s1", owner: "u1", wallet: { balance: 10, pending: 0 } };
  await assert.rejects(() => sellerStores.deleteStore("u1", "s1"), /Withdraw your balance/);
});

test("creating a store links it to the user (user.store) and refuses a second store", async () => {
  state.storeExists = false;
  state.created = null;
  await userStores.createStore("u1", { name: "فروشگاه من", category: "c1", isVerified: true });
  assert.equal(state.userUpdate.$set.store, "newStore");
  assert.equal(state.created.isVerified, undefined);
  assert.ok(state.created.slug.length > 0);

  state.storeExists = true;
  await assert.rejects(() => userStores.createStore("u1", { name: "x", category: "c1" }), /already have a store/);
});

test("Persian store names get a real slug", () => {
  assert.equal(toSlug("فروشگاه من"), "فروشگاه-من");
  assert.equal(toSlug("My Shop!"), "my-shop");
});

test("an ad owner can't publish, retype or add variants through an edit", async () => {
  state.listing = {
    _id: "l1", owner: "u1", listingType: "user_ad", status: "pending",
    save: async function () { return this; },
  };
  const { listing } = await userListing.updateListing("l1", { _id: "u1" }, {
    title: "new", status: "active", listingType: "store_product", variants: [{ sku: "x", price: 1 }],
  });
  assert.equal(listing.title, "new");
  assert.equal(listing.status, "pending");
  assert.equal(listing.listingType, "user_ad");
  assert.equal(listing.variants, undefined);
});

test("the buyer can't cancel once any item of the order has shipped", async () => {
  Object.assign(stubs, {
    [r("models/cart.js")]: {},
    [r("services/shared/wallet.js")]: { spendFromWallet: async () => 0, refundToWallet: async () => 0 },
    [r("services/shared/zarinpal.js")]: { createPayment: async () => ({}) },
    [r("utils/pricing.js")]: { round2: (n) => n },
  });
  const Order = require("../models/order.js");
  const userOrder = require("../services/user/order");
  const order = {
    _id: "o2", user: "u1", status: "processing",
    items: [{ fulfillment: { status: "shipped" } }, { fulfillment: { status: "pending" } }],
    save: async function () { return this; },
  };
  const orig = Order.findOne;
  Order.findOne = async () => order;
  try {
    await assert.rejects(() => userOrder.cancelOrder("o2", "u1"), /already been shipped/);
    assert.equal(order.status, "processing");
  } finally {
    Order.findOne = orig;
  }
});

test("buyer 'I received it' on an unpaid CASH order records receipt but never marks it paid", async () => {
  const Order = require("../models/order.js");
  const userOrder = require("../services/user/order");
  const order = {
    _id: "o3", user: "u1", status: "shipped", paymentMethod: "cash", paymentStatus: "pending", items: [],
    save: async function () { return this; },
  };
  const orig = Order.findOne;
  Order.findOne = async () => order;
  try {
    await userOrder.confirmDelivery("o3", "u1");
    assert.ok(order.buyerConfirmedAt);
    assert.equal(order.paymentStatus, "pending");   // only whoever got the cash confirms it
    assert.equal(order.status, "shipped");
    await assert.rejects(() => userOrder.confirmDelivery("o3", "u1"), /already confirmed/);
  } finally {
    Order.findOne = orig;
  }
});
