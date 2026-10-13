/* expected delivery time: stored per item, rolled up to the order, buyer is notified */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const r = (p) => path.resolve(__dirname, "..", p);
const sent = [];
let recentExists = false;
let lastFind = null;

const stubs = {
  mongoose: { Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
  [r("models/order.js")]: { find: (q) => { lastFind = q; return { limit: async () => [] }; } },
  [r("models/listing.js")]: {}, [r("models/coupon.js")]: {}, [r("models/store.js")]: {},
  [r("models/offerSeller.js")]: {},
  [r("models/notification.js")]: { exists: async () => recentExists },
  [r("services/shared/wallet.js")]: { refundToWallet: async () => 0 },
  [r("utils/helper.js")]: { escapeRegex: (s) => s },
  [r("utils/notify.js")]: async (user, msg, opts) => { sent.push({ user, msg, opts }); },
  [r("utils/logger.js")]: { warn() {}, error() {}, info() {} },
  [r("models/user.js")]: { find: () => ({ select: () => ({ lean: async () => [] }) }) },
  [r("services/shared/zarinpal.js")]: { verifyPayment: async () => ({}) },
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

process.env.APP_TIMEZONE = "Asia/Tehran";
const shared = require("../services/shared/order");
const notice = require("../services/shared/deliveryNotice");

const makeOrder = (items, extra = {}) => ({
  _id: "650000000000000000abc123", user: "u1", status: "processing", items,
  markModified() {}, ...extra,
});

test("shipping an item stores its expected delivery and the order takes the latest one", () => {
  const a = { fulfillment: {} };
  const b = { fulfillment: {} };
  const order = makeOrder([a, b]);
  shared.markItemShipped(a, "T1", new Date("2026-10-01T10:00:00Z"));
  shared.markItemShipped(b, null, new Date("2026-10-03T08:00:00Z"));
  shared.refreshExpectedDelivery(order);
  assert.equal(a.fulfillment.estimatedDeliveryAt.toISOString(), "2026-10-01T10:00:00.000Z");
  assert.equal(order.expectedDeliveryAt.toISOString(), "2026-10-03T08:00:00.000Z");
});

test("one store's part ships together with one tracking code and arrival time", () => {
  const a = { fulfillment: { status: "pending" } };
  const b = { fulfillment: { status: "pending" } };
  const gone = { cancelledAt: new Date(), fulfillment: { status: "pending" } };
  const order = makeOrder([a, b, gone]);

  const shipped = shared.shipItems(order, [a, b, gone], "T7", new Date("2026-10-04T09:00:00Z"));
  assert.equal(shipped.length, 2);
  assert.equal(a.fulfillment.trackingCode, "T7");
  assert.equal(b.fulfillment.estimatedDeliveryAt.toISOString(), "2026-10-04T09:00:00.000Z");
  assert.equal(order.status, "shipped");

  assert.throws(() => shared.shipItems(order, [a, b], "T8"), /already shipped/);
  assert.throws(() => shared.shipItems(makeOrder([a], { status: "created" }), [a], "T9"), /cannot be marked as shipped/);
});

test("the delivery time of a shipped part can be changed, not of an unshipped or finished one", () => {
  const shipped = { fulfillment: { status: "shipped", estimatedDeliveryAt: new Date("2026-10-01T10:00:00Z") } };
  const shipped2 = { fulfillment: { status: "shipped", estimatedDeliveryAt: new Date("2026-10-01T10:00:00Z") } };
  const pending = { fulfillment: { status: "pending" } };
  const order = makeOrder([shipped, shipped2, pending], { status: "shipped" });

  shared.setItemsDeliveryEstimate(order, [shipped, shipped2], new Date("2026-10-05T12:00:00Z"));
  assert.equal(shipped2.fulfillment.estimatedDeliveryAt.toISOString(), "2026-10-05T12:00:00.000Z");
  assert.equal(order.expectedDeliveryAt.toISOString(), "2026-10-05T12:00:00.000Z");

  assert.throws(() => shared.setItemsDeliveryEstimate(order, [pending], new Date()), /Ship the items first/);
  assert.throws(
    () => shared.setItemsDeliveryEstimate({ ...order, status: "completed" }, [shipped], new Date()),
    /can't be changed anymore/
  );
});

test("the buyer is told the day and time in Tehran time", async () => {
  sent.length = 0;
  const item = { productSnapshot: { title: "Phone" }, fulfillment: { trackingCode: "PX9", estimatedDeliveryAt: new Date("2026-09-30T10:30:00Z") } };
  await notice.notifyItemsShipped(makeOrder([item], { status: "shipped" }), [item]);
  assert.equal(sent.length, 1);
  assert.match(sent[0].msg, /Your order #ABC123 has shipped/);
  assert.match(sent[0].msg, /Expected delivery: Wed, Sep 30 at 14:00/); // 10:30 UTC = 14:00 Tehran
  assert.match(sent[0].msg, /Tracking code: PX9/);
  assert.equal(sent[0].opts.link, "/dashboard/orders/650000000000000000abc123");
});

test("the same message isn't sent twice in a row (several items shipped at once)", async () => {
  sent.length = 0;
  recentExists = true;
  const item = { fulfillment: { estimatedDeliveryAt: new Date("2026-09-30T10:30:00Z") } };
  await notice.notifyItemsShipped(makeOrder([item], { status: "shipped" }), [item]);
  assert.equal(sent.length, 0);
  recentExists = false;
});

test("several shipped items are named by count and store", async () => {
  sent.length = 0;
  const one = { productSnapshot: { title: "Phone" }, storeSnapshot: { name: "Central" }, fulfillment: {} };
  const two = { productSnapshot: { title: "Case" }, storeSnapshot: { name: "Central" }, fulfillment: {} };
  await notice.notifyItemsShipped(makeOrder([one, two, { fulfillment: {} }]), [one, two]);
  assert.match(sent[0].msg, /Part of your order #ABC123 has shipped \(2 items from Central\)/);
});

test("a changed delivery time is announced", async () => {
  sent.length = 0;
  const item = { fulfillment: { estimatedDeliveryAt: new Date("2026-10-02T05:30:00Z") } };
  await notice.notifyDeliveryUpdated(makeOrder([item]), [item]);
  assert.match(sent[0].msg, /was updated: now expected Fri, Oct 2 at 09:00/);
  assert.equal(sent[0].opts.type, "delivery_update");
});