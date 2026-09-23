const Order = require("../../models/order");
const logger = require("../../utils/logger");
const { verifyPayment } = require("./zarinpal");
const { walletSpentOn } = require("./wallet");
const { finalizeOrder, revertOrder, autoCompleteShippedOrders } = require("./order");

// an order that never reached the payment step is dropped after this
const ABANDON_AFTER_MS = Number(process.env.ORDER_ABANDON_MINUTES || 30) * 60 * 1000;
const BATCH = 100;

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
    // cash is collected on delivery, so a pending cash order is normal
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
    paymentStatus: "pending",
    paymentMethod: { $ne: "cash" },
    status: { $nin: ["cancelled", "completed"] },
    createdAt: { $lte: deadline },
  }).limit(BATCH);

  let paid = 0;
  let cancelled = 0;

  for (const order of orders) {
    let wasPaid = false;

    if (order.paymentMethod === "wallet" || order.pricing.walletUsed > 0) {
      wasPaid = (await walletSpentOn(order._id)) > 0;
    } else if (order.payment?.authority) {
      const result = await verifyPayment(order.payment.authority, order.pricing.total * 10);
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
      await revertOrder(order); // frees anything that was reserved
      cancelled++;
      logger.info(`[sweeper] order ${order._id} was never paid — cancelled`);
    }
  }

  return { paid, cancelled };
};

/* Runs all three sweeps; safe to call again at any time */
const runOrderSweeps = async () => {
  const finished = await completeHalfFinishedOrders();
  const payments = await resolvePendingPayments();
  const completed = await autoCompleteShippedOrders();
  return { finished, ...payments, completed };
};

module.exports = {
  completeHalfFinishedOrders,
  resolvePendingPayments,
  runOrderSweeps,
  isIncomplete,
};
