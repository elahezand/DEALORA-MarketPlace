/* the sweeper finishes half-done orders and decides the fate of unpaid ones */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

let found = [];
let lastQuery = null;
let walletCharged = 0;
const notifications = [];
let zarinpalSays = { success: true, refId: "9" };
const calls = { finalize: 0, revert: 0 };

const stubs = {
  mongoose: { Types: { ObjectId: class {} } },
  [path.resolve(__dirname, "../models/order.js")]: {
    find: (q) => { lastQuery = q; return { limit: async () => found }; },
  },
  [path.resolve(__dirname, "../services/shared/zarinpal.js")]: { verifyPayment: async () => zarinpalSays },
  [path.resolve(__dirname, "../services/shared/wallet.js")]: { walletSpentOn: async () => walletCharged },
  [path.resolve(__dirname, "../services/shared/order.js")]: {
    finalizeOrder: async (o) => { calls.finalize++; o.items.forEach((i) => { i.stockReserved = true; i.walletCredited = true; }); },
    revertOrder: async () => { calls.revert++; },
    completeDeliveredOrder: async () => {},
  },
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {}, info() {} },
  [path.resolve(__dirname, "../models/user.js")]: { find: () => ({ select: () => ({ lean: async () => [{ _id: "admin1" }, { _id: "admin2" }] }) }) },
  [path.resolve(__dirname, "../utils/notify.js")]: async (userId, msg, opts) => { notifications.push({ userId, msg, opts }); },
  [path.resolve(__dirname, "../models/store.js")]: { find: () => ({ select: () => ({ lean: async () => [{ _id: "s1", owner: "seller1" }] }) }) },
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
const { completeHalfFinishedOrders, resolvePendingPayments, flagOverdueCashOrders } = require("../services/shared/orderSweeper");

const halfDone = (extra = {}) => ({
  _id: "o1", finalizedAt: new Date(), paymentMethod: "cash", paymentStatus: "pending",
  status: "created", pricing: { total: 100, walletUsed: 0 }, payment: {},
  items: [{ store: "s1", stockReserved: true, walletCredited: false }],
  save: async () => {}, ...extra,
});

test("a half-finished CASH order is completed even though it is still pending", async () => {
  calls.finalize = 0;
  found = [halfDone()];
  const fixed = await completeHalfFinishedOrders();
  assert.equal(fixed, 1);
  assert.equal(calls.finalize, 1);
  assert.equal(lastQuery.finalizedAt.$ne, null);   // finalizedAt is the marker, not paymentStatus
});

test("an online order that was never paid is left alone here", async () => {
  calls.finalize = 0;
  found = [halfDone({ paymentMethod: "zarinpal", paymentStatus: "pending" })];
  const fixed = await completeHalfFinishedOrders();
  assert.equal(fixed, 0);
  assert.equal(calls.finalize, 0);
});

test("a pending WALLET order that was charged gets paid and finalized", async () => {
  calls.finalize = 0; walletCharged = 100;
  found = [halfDone({ paymentMethod: "wallet", finalizedAt: null, items: [{ store: null, stockReserved: false }] })];
  const res = await resolvePendingPayments();
  assert.equal(res.paid, 1);
  assert.equal(found[0].paymentStatus, "paid");
  assert.equal(calls.finalize, 1);
});

test("a pending WALLET order that was never charged is cancelled", async () => {
  calls.revert = 0; walletCharged = 0;
  found = [halfDone({ paymentMethod: "wallet", finalizedAt: null, items: [{ store: null, stockReserved: false }] })];
  const res = await resolvePendingPayments();
  assert.equal(res.cancelled, 1);
  assert.equal(found[0].status, "cancelled");
  assert.equal(calls.revert, 1);
});

test("an online order the buyer actually paid is finalized", async () => {
  calls.finalize = 0; walletCharged = 0; zarinpalSays = { success: true, refId: "55" };
  found = [halfDone({ paymentMethod: "zarinpal", finalizedAt: null, payment: { authority: "A1" }, items: [{ store: null, stockReserved: false }] })];
  const res = await resolvePendingPayments();
  assert.equal(res.paid, 1);
  assert.equal(found[0].payment.refId, "55");
});

test("an online order that was never paid is cancelled", async () => {
  calls.revert = 0; zarinpalSays = { success: false };
  found = [halfDone({ paymentMethod: "zarinpal", finalizedAt: null, payment: { authority: "A1" }, items: [{ store: null, stockReserved: false }] })];
  const res = await resolvePendingPayments();
  assert.equal(res.cancelled, 1);
  assert.equal(calls.revert, 1);
});

test("orders that never reached the gateway are only cancelled after the deadline", async () => {
  found = [];
  await resolvePendingPayments();
  const minutes = (Date.now() - lastQuery.createdAt.$lte.getTime()) / 60000;
  assert.ok(minutes >= 29 && minutes <= 31);
});

test("finishing a half-done CASH order does NOT mark it paid (cash is collected on delivery)", async () => {
  found = [halfDone()];
  await completeHalfFinishedOrders();
  assert.equal(found[0].paymentStatus, "pending");
});


test("mixed payment (wallet part + unpaid gateway part) is cancelled, not marked paid", async () => {
  calls.revert = 0; calls.finalize = 0;
  walletCharged = 30;                        // the wallet part WAS charged
  zarinpalSays = { success: false };         // but the gateway part was never paid
  found = [halfDone({
    paymentMethod: "zarinpal", finalizedAt: null, payment: { authority: "A9" },
    pricing: { total: 70, walletUsed: 30 }, items: [{ store: null, stockReserved: false }],
  })];
  const res = await resolvePendingPayments();
  assert.equal(res.paid, 0);
  assert.equal(res.cancelled, 1);            // revertOrder then refunds the 30
  assert.equal(calls.finalize, 0);
  walletCharged = 0; zarinpalSays = { success: true, refId: "9" };
});

const DAY = 86400000;

test("cash: nothing is asked before the delivery time has passed", async () => {
  notifications.length = 0;
  const order = halfDone({ status: "shipped", shippedAt: new Date(Date.now() - 2 * DAY), expectedDeliveryAt: new Date(Date.now() + DAY) });
  found = [order];
  assert.equal(await flagOverdueCashOrders(), 0);
  assert.equal(notifications.length, 0);
});

test("cash: 1 day after the delivery time, only the store that got the cash is asked", async () => {
  notifications.length = 0;
  const order = halfDone({
    status: "shipped", shippedAt: new Date(Date.now() - 4 * DAY),
    expectedDeliveryAt: new Date(Date.now() - 2 * DAY), cashCheckAskedAt: null, cashOverdueNotifiedAt: null,
  });
  found = [order];
  assert.equal(await flagOverdueCashOrders(), 1);
  assert.equal(notifications.length, 1);                  // the store's item → the store, no admins
  assert.equal(notifications[0].userId, "seller1");
  assert.match(notifications[0].msg, /did you receive the cash/);
  assert.equal(notifications[0].opts.type, "cod_check");
  assert.ok(order.cashCheckAskedAt);
  assert.equal(order.cashOverdueNotifiedAt, null);        // not escalated yet
  assert.equal(order.paymentStatus, "pending");           // silence never means paid
  assert.equal(order.status, "shipped");                  // ...or cancelled
  assert.equal(lastQuery.paymentMethod, "cash");
  assert.equal(lastQuery.paymentStatus, "pending");
  assert.equal(lastQuery["cashDispute.reportedAt"], null); // disputes are the admin's already
});

test("cash: no delivery time → asked 7 days after shipping; not re-asked within 3 days", async () => {
  notifications.length = 0;
  const fresh = halfDone({ status: "shipped", shippedAt: new Date(Date.now() - 6 * DAY), expectedDeliveryAt: null });
  const askedYesterday = halfDone({
    status: "shipped", shippedAt: new Date(Date.now() - 9 * DAY), expectedDeliveryAt: null,
    cashCheckAskedAt: new Date(Date.now() - DAY),
  });
  found = [fresh, askedYesterday];
  assert.equal(await flagOverdueCashOrders(), 0);
  assert.equal(notifications.length, 0);
});

test("cash: the site's own items are asked to the admins", async () => {
  notifications.length = 0;
  const order = halfDone({
    status: "shipped", shippedAt: new Date(Date.now() - 10 * DAY), expectedDeliveryAt: null,
    items: [{ store: null, stockReserved: true }],
  });
  found = [order];
  await flagOverdueCashOrders();
  assert.equal(notifications.length, 2);                   // two admins
  assert.ok(notifications.every((n) => n.opts.type === "cod_check"));
});

test("cash: still no answer 14 days after it was due → escalated to admins, never auto-cancelled", async () => {
  notifications.length = 0;
  const order = halfDone({
    status: "shipped", shippedAt: new Date(Date.now() - 25 * DAY), expectedDeliveryAt: null,
    cashCheckAskedAt: new Date(Date.now() - DAY),
  });
  found = [order];
  assert.equal(await flagOverdueCashOrders(), 1);
  assert.equal(notifications.length, 2);                   // two admins
  assert.equal(notifications[0].opts.type, "cod_overdue");
  assert.ok(order.cashOverdueNotifiedAt);
  assert.equal(order.status, "shipped");
});
