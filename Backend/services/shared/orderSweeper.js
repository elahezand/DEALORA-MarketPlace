const Order = require("../../models/order");
const User = require("../../models/user");
const Store = require("../../models/store");
const notifyUser = require("../../utils/notify");
const logger = require("../../utils/logger");
const { verifyPayment } = require("./zarinpal");
const { walletSpentOn } = require("./wallet");
const { finalizeOrder, revertOrder, completeDeliveredOrder } = require("./order");

// an order that never reached the payment step is dropped after this
const ABANDON_AFTER_MS = Number(process.env.ORDER_ABANDON_MINUTES || 30) * 60 * 1000;
const BATCH = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
// a shipped order the buyer never confirmed is completed after this many days
const AUTO_COMPLETE_DAYS = Number(process.env.ORDER_AUTO_COMPLETE_DAYS || 7);
// cash on delivery — when to ask "did you receive the cash?":
//   1 day after the promised delivery time, or (no delivery time) N days after shipping
const COD_ASK_AFTER_SHIP_DAYS = Number(process.env.ORDER_AUTO_COMPLETE_DAYS || 7);
const COD_ASK_AFTER_ETA_DAYS = Number(process.env.ORDER_COD_ASK_AFTER_ETA_DAYS || 1);
// ask again every N days while there's no answer
const COD_REMIND_EVERY_DAYS = Number(process.env.ORDER_COD_REMIND_DAYS || 3);
// no answer this many days after the first question → an admin takes over
const COD_ESCALATE_DAYS = Number(process.env.ORDER_COD_ESCALATE_DAYS || 14);

/** when the cash should have been handed over */
const cashDueAt = (order) => {
  if (order.expectedDeliveryAt) {
    return new Date(new Date(order.expectedDeliveryAt).getTime() + COD_ASK_AFTER_ETA_DAYS * DAY_MS);
  }
  return new Date(new Date(order.shippedAt).getTime() + COD_ASK_AFTER_SHIP_DAYS * DAY_MS);
};

/** cash orders an admin must look at: escalated (no answer) or disputed (shared with the admin filter) */
const overdueCashQuery = () => ({
  status: { $in: ["processing", "shipped"] },
  paymentMethod: "cash",
  paymentStatus: "pending",
  $or: [{ cashOverdueNotifiedAt: { $ne: null } }, { "cashDispute.reportedAt": { $ne: null } }],
});

const isIncomplete = (order) =>
  !order.items.every((i) => i.stockReserved && (!i.store || i.walletCredited));

/* 1) money already taken, finalize never finished → continue it */
const completeHalfFinishedOrders = async () => {
  const orders = await Order.find({
    finalizedAt: { $ne: null },
    status: { $nin: ["cancelled"] },
    $or: [
      { "items.stockReserved": false },
      { items: { $elemMatch: { store: { $ne: null }, walletCredited: false } } },
    ],
  }).limit(BATCH);

  let fixed = 0;
  for (const order of orders) {
    if (order.paymentMethod !== "cash" && order.paymentStatus !== "paid") continue;
    await finalizeOrder(order);
    
    await order.save();
    fixed++;
    logger.info(`[sweeper] finished order ${order._id}`);
  }
  return fixed;
};

/* 2) orders still waiting for payment → ask the real source, then finish or cancel */
const resolvePendingPayments = async () => {
  const deadline = new Date(Date.now() - ABANDON_AFTER_MS);

  const orders = await Order.find({
    // "failed" too: a failed gateway payment may still hold money the wallet already paid
    paymentStatus: { $in: ["pending", "failed"] },
    paymentMethod: { $ne: "cash" },
    status: { $nin: ["cancelled", "completed"] },
    createdAt: { $lte: deadline },
  }).limit(BATCH);

  let paid = 0;
  let cancelled = 0;

  for (const order of orders) {
    let wasPaid = false;

    if (order.paymentMethod === "wallet") {
      wasPaid = (await walletSpentOn(order._id)) > 0;
    } else if (order.payment?.authority) {
      const result = await verifyPayment(order.payment.authority, Math.round(order.pricing.total * 10));
      // gateway unreachable → decide next round instead of cancelling a maybe-paid order
      if (result.unreachable) continue;
      wasPaid = result.success === true;
      if (wasPaid) order.payment.refId = result.refId;
    }
    // no authority and no wallet charge → the buyer never reached the gateway

    if (wasPaid) {
      order.paymentStatus = "paid";
      order.payment.paidAt = order.payment.paidAt || new Date();
      order.finalizedAt = order.finalizedAt || new Date();
      await order.save();

      await finalizeOrder(order);
      await order.save();
      paid++;
      logger.info(`[sweeper] order ${order._id} was paid after all — finalized`);
    } else {
      order.status = "cancelled";
      await order.save();
      await revertOrder(order);
      cancelled++;
      logger.info(`[sweeper] order ${order._id} was never paid — cancelled`);
    }
  }
  return { paid, cancelled };
};

/* 3) shipped orders the buyer never confirmed → completed after AUTO_COMPLETE_DAYS */
const autoCompleteShippedOrders = async () => {
  const deadline = new Date(Date.now() - AUTO_COMPLETE_DAYS * DAY_MS);

  const orders = await Order.find({
    status: "shipped",
    paymentStatus: "paid",
    shippedAt: { $lte: deadline },
    $or: [{ expectedDeliveryAt: null }, { expectedDeliveryAt: { $lte: deadline } }],
    autoCompletedAt: null,
  }).limit(BATCH);

  for (const order of orders) {
    await completeDeliveredOrder(order, { auto: true });
    logger.info(`[sweeper] order ${order._id} auto-completed`);
  }
  return orders.length;
};

const notifyAdmins = async (admins, msg, opts) => {
  for (const admin of admins) await notifyUser(admin._id, msg, opts);
};

const notifyStoreOwners = async (storeIds, msg, opts) => {
  if (!storeIds.length) return;
  const stores = await Store.find({ _id: { $in: storeIds } }).select("owner").lean();
  for (const store of stores) await notifyUser(store.owner, msg, opts);
};

/*
 * 4) cash orders after delivery time → ask who got the cash, every few days.
 * No answer for COD_ESCALATE_DAYS → admins take over. Never cancelled or paid on silence.
 */
const flagOverdueCashOrders = async () => {
  const now = Date.now();

  const orders = await Order.find({
    status: "shipped",
    paymentMethod: "cash",
    paymentStatus: "pending",
    cashOverdueNotifiedAt: null,
    "cashDispute.reportedAt": null,
    shippedAt: { $lte: new Date(now - DAY_MS) },
  }).limit(BATCH);

  if (!orders.length) return 0;

  const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
  let handled = 0;

  for (const order of orders) {
    const due = cashDueAt(order).getTime();
    if (now < due) continue;

    const id = String(order._id).slice(-6).toUpperCase();
    const adminLink = `/dashboard/admin/transactions/${order._id}`;

    // no answer for too long → admins
    if (now >= due + COD_ESCALATE_DAYS * DAY_MS) {
      await notifyAdmins(
        admins,
        `Cash order #${id}: no cash confirmed ${COD_ESCALATE_DAYS} days after delivery — follow up or cancel it`,
        { type: "cod_overdue", link: adminLink }
      );
      order.cashOverdueNotifiedAt = new Date();
      await order.save();
      handled++;
      continue;
    }

    // already asked recently
    const lastAsked = order.cashCheckAskedAt ? new Date(order.cashCheckAskedAt).getTime() : 0;
    if (now - lastAsked < COD_REMIND_EVERY_DAYS * DAY_MS) continue;

    const open = order.items.filter((item) => !item.cashCollectedAt);
    const storeIds = [...new Set(open.filter((i) => i.store).map((i) => String(i.store)))];
    const buyerNote = order.buyerConfirmedAt ? " The buyer confirmed receipt." : "";

    // store items → store owner
    await notifyStoreOwners(
      storeIds,
      `Order #${id} should have been delivered — did you receive the cash?${buyerNote}`,
      { type: "cod_check", link: "/dashboard/seller/orders" }
    );

    // site items → admins
    if (open.some((i) => !i.store)) {
      await notifyAdmins(
        admins,
        `Cash order #${id} should have been delivered — did the site receive the cash?${buyerNote}`,
        { type: "cod_check", link: adminLink }
      );
    }

    order.cashCheckAskedAt = new Date();
    await order.save();
    handled++;
  }

  return handled;
};
const runOrderSweeps = async () => {
  const finished = await completeHalfFinishedOrders();
  const payments = await resolvePendingPayments();
  const completed = await autoCompleteShippedOrders();
  const overdueCash = await flagOverdueCashOrders();
  return { finished, ...payments, completed, overdueCash };
};

module.exports = {
  autoCompleteShippedOrders,
  flagOverdueCashOrders,
  overdueCashQuery,
  cashDueAt,
  completeHalfFinishedOrders,
  resolvePendingPayments,
  runOrderSweeps,
  isIncomplete,
};
