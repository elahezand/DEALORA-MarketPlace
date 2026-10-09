const Order = require("../../models/order");
const User = require("../../models/user");
const Store = require("../../models/store");
const notifyUser = require("../../utils/notify");
const logger = require("../../utils/logger");
const { verifyPayment } = require("./zarinpal");
const { walletSpentOn } = require("./wallet");
const {
  finalizeOrder, revertOrder, completeItems, groupKeys, groupItems, deliveryDueAt,
} = require("./order");

// an order that never reached the payment step is dropped after this
const ABANDON_AFTER_MS = Number(process.env.ORDER_ABANDON_MINUTES || 30) * 60 * 1000;
const BATCH = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
// a shipped part the buyer never confirmed is completed this many days after its delivery time
const AUTO_COMPLETE_DAYS = Number(process.env.ORDER_AUTO_COMPLETE_DAYS || 7);
// cash on delivery — ask "did you receive the cash?" this many days after the delivery time
const COD_ASK_AFTER_ETA_DAYS = Number(process.env.ORDER_COD_ASK_AFTER_ETA_DAYS || 1);
// ask again every N days while there's no answer
const COD_REMIND_EVERY_DAYS = Number(process.env.ORDER_COD_REMIND_DAYS || 3);
// no answer this many days after it was due → an admin takes over
const COD_ESCALATE_DAYS = Number(process.env.ORDER_COD_ESCALATE_DAYS || 14);

/** latest delivery time among some items */
const latestDue = (items) => {
  const times = items.map(deliveryDueAt).filter(Boolean).map((d) => d.getTime());
  return times.length ? Math.max(...times) : null;
};

/** when the cash for these items should have been handed over */
const cashDueAt = (items) => {
  const due = latestDue(items);
  return due ? new Date(due + COD_ASK_AFTER_ETA_DAYS * DAY_MS) : null;
};

/** cash orders an admin must look at: escalated (no answer) or disputed (shared with the admin filter) */
const overdueCashQuery = () => ({
  status: { $in: ["processing", "shipped"] },
  paymentMethod: "cash",
  paymentStatus: "pending",
  $or: [{ cashOverdueNotifiedAt: { $ne: null } }, { "cashDispute.reportedAt": { $ne: null } }],
});

const isIncomplete = (order) =>
  !order.items
    .filter((i) => !i.cancelledAt)
    .every((i) => i.stockReserved && (!i.store || i.walletCredited));

/* 1) money already taken, finalize never finished → continue it */
const completeHalfFinishedOrders = async () => {
  const orders = await Order.find({
    finalizedAt: { $ne: null },
    status: { $nin: ["cancelled"] },
    $or: [
      { items: { $elemMatch: { cancelledAt: null, stockReserved: false } } },
      { items: { $elemMatch: { cancelledAt: null, store: { $ne: null }, walletCredited: false } } },
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

/* 3) each store's part: delivered + AUTO_COMPLETE_DAYS and buyer didn't confirm → completed, seller paid */
const autoCompleteShippedOrders = async () => {
  const now = Date.now();

  const orders = await Order.find({
    status: { $in: ["processing", "shipped"] },
    $or: [{ paymentStatus: "paid" }, { paymentMethod: "cash" }],
    items: {
      $elemMatch: {
        cancelledAt: null,
        deliveredAt: null,
        "fulfillment.status": "shipped",
        "fulfillment.shippedAt": { $lte: new Date(now - AUTO_COMPLETE_DAYS * DAY_MS) },
      },
    },
  }).limit(BATCH);

  let completed = 0;
  for (const order of orders) {
    for (const key of groupKeys(order)) {
      const items = groupItems(order, key).filter((item) => !item.deliveredAt);
      if (!items.length || items.some((item) => item.fulfillment?.status !== "shipped")) continue;
      if (now < latestDue(items) + AUTO_COMPLETE_DAYS * DAY_MS) continue;
      // cash: never on silence — only once the cash was confirmed
      if (order.paymentMethod === "cash" && items.some((item) => !item.cashCollectedAt)) continue;

      await completeItems(order, items, { auto: true });
      completed++;
      logger.info(`[sweeper] order ${order._id} part ${key} auto-completed`);
    }
  }
  return completed;
};

const notifyAdmins = async (admins, msg, opts) => {
  for (const admin of admins) await notifyUser(admin._id, msg, opts);
};

/*
 * 4) cash orders after delivery time → ask who got the cash (each store for its part), every few days.
 * No answer for COD_ESCALATE_DAYS → admins take over. Never cancelled or paid on silence.
 */
const flagOverdueCashOrders = async () => {
  const now = Date.now();

  const orders = await Order.find({
    status: { $in: ["processing", "shipped"] },
    paymentMethod: "cash",
    paymentStatus: "pending",
    cashOverdueNotifiedAt: null,
    "cashDispute.reportedAt": null,
    items: {
      $elemMatch: {
        cancelledAt: null,
        cashCollectedAt: null,
        "fulfillment.status": "shipped",
        "fulfillment.shippedAt": { $lte: new Date(now - DAY_MS) },
      },
    },
  }).limit(BATCH);

  if (!orders.length) return 0;

  const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
  let handled = 0;

  for (const order of orders) {
    const id = String(order._id).slice(-6).toUpperCase();
    const adminLink = `/dashboard/admin/transactions/${order._id}`;
    let changed = false;

    for (const key of groupKeys(order)) {
      const items = groupItems(order, key).filter((item) => !item.cashCollectedAt);
      if (!items.length || items.some((item) => item.fulfillment?.status !== "shipped")) continue;

      const due = cashDueAt(items);
      if (!due || now < due.getTime()) continue;

      // no answer for too long → admins
      if (now >= due.getTime() + COD_ESCALATE_DAYS * DAY_MS) {
        await notifyAdmins(
          admins,
          `Cash order #${id}: no cash confirmed ${COD_ESCALATE_DAYS} days after delivery — follow up or cancel it`,
          { type: "cod_overdue", link: adminLink }
        );
        order.cashOverdueNotifiedAt = new Date();
        changed = true;
        break;
      }

      // already asked recently
      const lastAsked = Math.max(0, ...items.map((item) => (item.cashCheckAskedAt ? new Date(item.cashCheckAskedAt).getTime() : 0)));
      if (now - lastAsked < COD_REMIND_EVERY_DAYS * DAY_MS) continue;

      const buyerNote = items.some((item) => item.buyerConfirmedAt) ? " The buyer confirmed receipt." : "";

      if (key === "site") {
        await notifyAdmins(
          admins,
          `Cash order #${id} should have been delivered — did the site receive the cash?${buyerNote}`,
          { type: "cod_check", link: adminLink }
        );
      } else {
        const store = await Store.findById(key).select("owner").lean();
        if (store) {
          await notifyUser(
            store.owner,
            `Order #${id} should have been delivered — did you receive the cash?${buyerNote}`,
            { type: "cod_check", link: "/dashboard/seller/orders" }
          );
        }
      }

      const askedAt = new Date();
      for (const item of items) item.cashCheckAskedAt = askedAt;
      order.markModified("items");
      changed = true;
    }

    if (changed) {
      await order.save();
      handled++;
    }
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
