const { Types } = require("mongoose");
const Order = require("../../models/order");
const Listing = require("../../models/listing");
const Coupon = require("../../models/coupon");
const Store = require("../../models/store");
const { refundToWallet } = require("./wallet");
const OfferSeller = require("../../models/offerSeller");
const { escapeRegex } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { round2 } = require("../../utils/pricing");
// when an item should have arrived (no delivery time → 3 days after shipping)
const deliveryDueAt = (item) => {
  if (item.fulfillment?.estimatedDeliveryAt) return new Date(item.fulfillment.estimatedDeliveryAt);
  const shippedAt = item.fulfillment?.shippedAt;
  return shippedAt ? new Date(new Date(shippedAt).getTime() + 3 * 24 * 60 * 60 * 1000) : null;
};

const buildOrderIdSearchExpr = (q) => {
  if (!q || !String(q).trim()) return null;
  return {
    $regexMatch: {
      input: { $toString: "$_id" },
      regex: escapeRegex(String(q).trim()),
      options: "i",
    },
  };
};

const finalizeOrder = async (order) => {
  if (order.coupon?.couponId && !order.couponCounted) {
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: 1 } });
    order.couponCounted = true;
    await order.save();
  }
  for (const item of order.items) {
    // 2) stock — once per item
    if (!item.stockReserved) {
      let result = null;

      if (item.offer) {
        result = await OfferSeller.updateOne(
          { _id: item.offer, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        await Listing.updateOne({ _id: item.productId }, { $inc: { "metrics.sold": item.quantity } });
      } else if (item.variantId) {
        result = await Listing.updateOne(
          {
            _id: item.productId,
            variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } },
          },
          {
            $inc: {
              "metrics.sold": item.quantity,
              "variants.$[elem].stock": -item.quantity,
            },
          },
          { arrayFilters: [{ "elem._id": new Types.ObjectId(item.variantId) }] }
        );
      }

      if (result && result.modifiedCount === 0) {
        logger.error(
          `[order ${order._id}] stock update FAILED for product ${item.productId} (offer: ${item.offer || "none"}, variantId: ${item.variantId || "none"}, qty: ${item.quantity}) - needs manual review/refund.`
        );
      }

      item.stockReserved = true;
      await order.save();
    }
    // 3) hold the seller's money — once per item (released after delivery)
    if (item.store && !item.walletCredited) {
      if (order.paymentMethod === "cash") {

        item.paidDirectToStore = true;
        item.walletCredited = true;
        item.walletReleased = true;
      } else {
        await Store.updateOne(
          { _id: item.store },
          { $inc: { "wallet.pending": item.finalPrice * item.quantity } }
        );
        item.walletCredited = true;
      }
      await order.save();
    }
  }
  order.status = "processing";
};

/*Buyer received the order → the held money becomes withdrawable */
const releaseOrderFunds = async (order) => {
  for (const item of order.items) {
    if (!item.store || !item.walletCredited || item.walletReleased) continue;

    const amount = item.finalPrice * item.quantity;
    await Store.updateOne(
      { _id: item.store },
      { $inc: { "wallet.pending": -amount, "wallet.balance": amount } }
    );
    item.walletReleased = true;
    await order.save();
  }

  if (!order.fundsReleasedAt) {
    order.fundsReleasedAt = new Date();
    await order.save();
  }
};

/* Order cancelled before delivery → give the stock back, drop the held money
 * and give the coupon use back. Runs once (revertedAt)*/
const revertOrder = async (order) => {
  if (order.revertedAt) return;

  for (const item of order.items) {
    if (item.store && item.walletCredited && !item.walletReleased) {
      await Store.updateOne(
        { _id: item.store },
        { $inc: { "wallet.pending": -(item.finalPrice * item.quantity) } }
      );
      item.walletCredited = false;
    }

    if (item.stockReserved) {
      if (item.offer) {
        await OfferSeller.updateOne({ _id: item.offer }, { $inc: { stock: item.quantity } });
        await Listing.updateOne({ _id: item.productId }, { $inc: { "metrics.sold": -item.quantity } });
      } else if (item.variantId) {
        await Listing.updateOne(
          { _id: item.productId },
          { $inc: { "metrics.sold": -item.quantity, "variants.$[elem].stock": item.quantity } },
          { arrayFilters: [{ "elem._id": new Types.ObjectId(item.variantId) }] }
        );
      }
      item.stockReserved = false;
    }
    await order.save();
  }

  if (order.coupon?.couponId && order.couponCounted) {
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: -1 } });
    order.couponCounted = false;
  }

  // give the money back to the buyer's wallet: what the gateway took + what the wallet paid
  const walletUsed = order.pricing.walletUsed || 0;
  const gatewayPaid = order.paymentStatus === "paid" ? order.pricing.total : 0;
  const refund = round2(gatewayPaid + walletUsed);

  if (refund > 0) {
    const given = await refundToWallet(order.user, order._id, refund, "order cancelled");
    if (given > 0) {
      if (gatewayPaid > 0) order.paymentStatus = "refunded";
      order.refundedAt = new Date();
      order.refundAmount = given;
    }
  }

  order.revertedAt = new Date();
  await order.save();
};

/* paid order delivered → completed, seller's money released */
const completeDeliveredOrder = async (order, { auto = false } = {}) => {
  if (order.paymentStatus !== "paid") {
    throw new AppError(400, "This order isn't paid yet");
  }

  order.status = "completed";
  order.isDelivered = true;
  order.deliveredAt = order.deliveredAt || new Date();
  if (auto) order.autoCompletedAt = new Date();
  await order.save();

  await releaseOrderFunds(order);
};

/* store (or admin for site items) confirms the cash → paid, completes if buyer already confirmed */
const markCashCollected = async (order, items, userId) => {

  if (order.paymentMethod !== "cash") {
    throw new AppError(400, "This order wasn't paid in cash");
  }

  if (!["processing", "shipped"].includes(order.status)) {
    throw new AppError(400, `Cash can't be confirmed on a ${order.status} order`);
  }
  const open = items.filter((item) => !item.cashCollectedAt);
  if (!open.length) throw new AppError(409, "The cash for these items is already confirmed");

  if (open.some((item) => item.fulfillment?.status !== "shipped")) {
    throw new AppError(400, "Ship the items first — cash is paid on delivery");
  }

  const now = new Date();
  for (const item of open) {
    item.cashCollectedAt = now;
    item.cashCollectedBy = userId;
  }
  order.markModified("items");

  // all items confirmed → paid
  const allCollected = order.items.every((item) => !!item.cashCollectedAt);
  if (allCollected) order.paymentStatus = "paid";

  // buyer already confirmed → complete now, otherwise auto-complete later
  if (allCollected && order.buyerConfirmedAt) {
    await completeDeliveredOrder(order);
    return { order, paid: true, completed: true };
  }

  await order.save();
  return { order, paid: allCollected, completed: false };
};

/* store (or admin for site items) says the cash never arrived → cancel, or dispute for admin */
const reportCashNotReceived = async (order, items, userId, note = null) => {

  if (order.paymentMethod !== "cash") {
    throw new AppError(400, "This order wasn't paid in cash");
  }

  if (!["processing", "shipped"].includes(order.status)) {
    throw new AppError(400, `Cash can't be reported on a ${order.status} order`);
  }

  if (order.cashDispute?.reportedAt) {
    throw new AppError(409, "Missing cash was already reported for this order — an admin is reviewing it");
  }

  const open = items.filter((item) => !item.cashCollectedAt);
  if (!open.length) throw new AppError(409, "You already confirmed the cash for these items");
  if (open.some((item) => item.fulfillment?.status !== "shipped")) {
    throw new AppError(400, "Ship the items first — cash is paid on delivery");
  }
  // too early → the parcel may still be on its way
  if (open.some((item) => deliveryDueAt(item) && Date.now() < deliveryDueAt(item))) {
    throw new AppError(400, "You can report missing cash only after the delivery time");
  }

  order.cashDispute = { reportedAt: new Date(), reportedBy: userId, note: note || null };

  // buyer never confirmed and no cash came in → parcel was refused, cancel and return stock
  const anyCashConfirmed = order.items.some((item) => !!item.cashCollectedAt);
  if (!order.buyerConfirmedAt && !anyCashConfirmed) {
    order.status = "cancelled";
    await order.save();
    await revertOrder(order);
    return { order, outcome: "cancelled" };
  }

  await order.save();
  return { order, outcome: "disputed" };
};

const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;
  const allShipped = order.items.every((item) => item.fulfillment?.status === "shipped");
  if (allShipped) {
    order.status = "shipped";
    order.shippedAt = order.shippedAt || new Date();
  }
};

const markItemShipped = (item, trackingCode, estimatedDeliveryAt = null) => {
  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
    estimatedDeliveryAt: estimatedDeliveryAt || null,
  };
};

/** order.expectedDeliveryAt = the latest arrival time among the items that have one */
const refreshExpectedDelivery = (order) => {
  const times = (order.items || [])
    .map((item) => item.fulfillment?.estimatedDeliveryAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  order.expectedDeliveryAt = times.length ? new Date(Math.max(...times)) : null;
};

/** changes the expected arrival of an item that already shipped */
const setItemDeliveryEstimate = (order, item, estimatedDeliveryAt) => {
  if (["completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, `The delivery time of a ${order.status} order can't be changed`);
  }
  if (item.fulfillment?.status !== "shipped") {
    throw new AppError(400, "Ship the item first, then set its delivery time");
  }
  item.fulfillment.estimatedDeliveryAt = estimatedDeliveryAt;
  order.markModified("items");
  refreshExpectedDelivery(order);
};

const assertShippable = (order) => {
  if (order.status === "created" || order.status === "cancelled") {
    throw new AppError(400, `Order cannot be marked as shipped from status "${order.status}"`);
  }
};

module.exports = {
  completeDeliveredOrder,
  releaseOrderFunds,
  revertOrder,
  buildOrderIdSearchExpr,
  finalizeOrder,
  maybeMarkOrderShipped,
  markItemShipped,
  refreshExpectedDelivery,
  setItemDeliveryEstimate,
  markCashCollected,
  reportCashNotReceived,
  assertShippable,
};
