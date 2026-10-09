const { Types } = require("mongoose");
const Order = require("../../models/order");
const Listing = require("../../models/listing");
const Coupon = require("../../models/coupon");
const Store = require("../../models/store");
const { refundPartToWallet } = require("./wallet");
const OfferSeller = require("../../models/offerSeller");
const { escapeRegex } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { round2 } = require("../../utils/pricing");

const DAY_MS = 24 * 60 * 60 * 1000;

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

/* ---------- groups: each store's items (or the site's) are one part of the order ---------- */

const groupKey = (item) => (item.store ? String(item.store._id || item.store) : "site");
const activeItems = (order) => (order.items || []).filter((item) => !item.cancelledAt);
const groupItems = (order, key) => activeItems(order).filter((item) => groupKey(item) === key);
const groupKeys = (order) => [...new Set(activeItems(order).map(groupKey))];
const itemValue = (item) => item.finalPrice * item.quantity;
const isShipped = (item) => item.fulfillment?.status === "shipped";

// when an item should have arrived (no delivery time → 3 days after shipping)
const deliveryDueAt = (item) => {
  if (item.fulfillment?.estimatedDeliveryAt) return new Date(item.fulfillment.estimatedDeliveryAt);
  const shippedAt = item.fulfillment?.shippedAt;
  return shippedAt ? new Date(new Date(shippedAt).getTime() + 3 * DAY_MS) : null;
};

/* ---------- stock ---------- */

const takeStock = async (item) => {
  if (item.offer) {
    const result = await OfferSeller.updateOne(
      { _id: item.offer, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (result.modifiedCount) {
      await Listing.updateOne({ _id: item.productId }, { $inc: { "metrics.sold": item.quantity } });
    }
    return result.modifiedCount > 0;
  }
  if (item.variantId) {
    const result = await Listing.updateOne(
      {
        _id: item.productId,
        variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } },
      },
      { $inc: { "metrics.sold": item.quantity, "variants.$[elem].stock": -item.quantity } },
      { arrayFilters: [{ "elem._id": new Types.ObjectId(item.variantId) }] }
    );
    return result.modifiedCount > 0;
  }
  return true; // nothing to count
};

const giveStockBack = async (item) => {
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
};

// reserve stock before payment — throws if something ran out
const reserveStock = async (order) => {
  for (const item of order.items) {
    if (item.stockReserved || item.cancelledAt) continue;

    const ok = await takeStock(item);
    if (!ok) throw new AppError(409, `"${item.productSnapshot.title}" is out of stock`);

    item.stockReserved = true;
    await order.save();
  }
};

/* ---------- after payment ---------- */

const finalizeOrder = async (order) => {
  // 1) coupon usage — once per order
  if (order.coupon?.couponId && !order.couponCounted) {
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: 1 } });
    order.couponCounted = true;
    await order.save();
  }

  for (const item of order.items) {
    if (item.cancelledAt) continue;

    // 2) stock — normally reserved at checkout already
    if (!item.stockReserved) {
      const ok = await takeStock(item);
      if (!ok) {
        logger.error(`[order ${order._id}] stock update FAILED for product ${item.productId} - needs manual review/refund.`);
      }
      item.stockReserved = true;
      await order.save();
    }

    // 3) hold the seller's money — once per item (released after delivery)
    if (item.store && !item.walletCredited) {
      if (order.paymentMethod === "cash") {
        // cash goes straight from the buyer to the store, the site never holds it
        item.paidDirectToStore = true;
        item.walletCredited = true;
        item.walletReleased = true;
      } else {
        await Store.updateOne({ _id: item.store }, { $inc: { "wallet.pending": itemValue(item) } });
        item.walletCredited = true;
      }
      await order.save();
    }
  }
  if (order.status === "created") order.status = "processing";
};

/* ---------- delivery ---------- */

// seller's held money → withdrawable. The flag is claimed first, so two runs can't pay twice.
const releaseItemFunds = async (order, items) => {
  for (const item of items) {
    if (!item.store || !item.walletCredited || item.walletReleased) continue;

    const claimed = await Order.updateOne(
      { _id: order._id, items: { $elemMatch: { _id: item._id, walletReleased: false } } },
      { $set: { "items.$.walletReleased": true } }
    );
    item.walletReleased = true;
    if (!claimed.modifiedCount) continue;

    const amount = itemValue(item);
    await Store.updateOne(
      { _id: item.store },
      { $inc: { "wallet.pending": -amount, "wallet.balance": amount } }
    );
  }
};

// every remaining part delivered → the whole order is completed
const maybeCompleteOrder = async (order) => {
  const active = activeItems(order);
  if (!active.length || order.status === "completed") return;
  if (!active.every((item) => item.deliveredAt)) return;

  order.status = "completed";
  order.isDelivered = true;
  order.deliveredAt = order.deliveredAt || new Date();
  if (active.every((item) => item.autoCompletedAt)) order.autoCompletedAt = new Date();
  if (order.paymentMethod === "cash") order.paymentStatus = "paid";
  order.fundsReleasedAt = order.fundsReleasedAt || new Date();
  await order.save();
};

/* one part (or all) delivered → its seller gets paid; completes the order when nothing is left */
const completeItems = async (order, items, { auto = false } = {}) => {
  const open = items.filter((item) => !item.deliveredAt && !item.cancelledAt);
  if (!open.length) return false;

  if (open.some((item) => !isShipped(item))) {
    throw new AppError(400, "These items haven't been shipped yet");
  }
  const paid =
    order.paymentMethod === "cash"
      ? open.every((item) => item.cashCollectedAt)
      : order.paymentStatus === "paid";
  if (!paid) throw new AppError(400, "These items aren't paid yet");

  const now = new Date();
  for (const item of open) {
    item.deliveredAt = now;
    if (auto) item.autoCompletedAt = now;
  }
  order.markModified("items");
  await order.save();

  await releaseItemFunds(order, open);
  await order.save();
  await maybeCompleteOrder(order);
  return true;
};

// all remaining items of the order
const completeDeliveredOrder = (order, options) => completeItems(order, activeItems(order), options);

/* ---------- cancelling ---------- */

// what the buyer paid for these items (their share of total + wallet)
const refundShare = (order, items, isLast) => {
  const paid =
    (order.paymentStatus === "paid" && order.paymentMethod !== "cash" ? order.pricing.total : 0) +
    (order.pricing.walletUsed || 0);
  if (paid <= 0) return 0;
  if (isLast) return round2(Math.max(0, paid - (order.refundAmount || 0)));

  const all = order.items.reduce((sum, item) => sum + itemValue(item), 0);
  const part = items.reduce((sum, item) => sum + itemValue(item), 0);
  return all > 0 ? round2((paid * part) / all) : 0;
};

/* cancels some items (one store's part, or everything left) — stock back, buyer refunded */
const cancelItems = async (order, items, reason = null) => {
  const open = items.filter((item) => !item.cancelledAt);
  if (!open.length) return 0;
  if (open.some((item) => item.deliveredAt)) {
    throw new AppError(400, "Delivered items can't be cancelled");
  }

  const isLast = activeItems(order).every((item) => open.includes(item));
  const refund = refundShare(order, open, isLast);
  const now = new Date();

  // refund first: the key makes a retry after a crash give nothing twice
  if (refund > 0) {
    const key = `cancel:${order._id}:${open.map((item) => String(item._id)).sort().join(",")}`;
    const given = await refundPartToWallet(order.user, order._id, key, refund, "order cancelled");
    order.refundAmount = round2((order.refundAmount || 0) + given);
    if (given > 0) order.refundedAt = now;
  }

  for (const item of open) {
    // seller's money is only taken back while it is still held
    if (item.store && item.walletCredited && !item.walletReleased) {
      await Store.updateOne({ _id: item.store }, { $inc: { "wallet.pending": -itemValue(item) } });
      item.walletCredited = false;
    }
    if (item.stockReserved) {
      await giveStockBack(item);
      item.stockReserved = false;
    }
    item.cancelledAt = now;
    item.cancelReason = reason;
    order.markModified("items");
    await order.save();
  }

  if (isLast) {
    // nothing left → the whole order is cancelled
    if (order.coupon?.couponId && order.couponCounted) {
      await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: -1 } });
      order.couponCounted = false;
    }
    if (order.paymentStatus === "paid" && order.paymentMethod !== "cash") order.paymentStatus = "refunded";
    order.status = "cancelled";
    order.revertedAt = now;
  } else {
    maybeMarkOrderShipped(order);
    // cash: the rest was already paid → the order is paid now
    if (order.paymentMethod === "cash" && activeItems(order).every((item) => item.cashCollectedAt)) {
      order.paymentStatus = "paid";
    }
  }

  await order.save();
  if (!isLast) await maybeCompleteOrder(order);
  return refund;
};

/* whole order cancelled before delivery. Runs once (revertedAt). */
const revertOrder = async (order) => {
  if (order.revertedAt) return;
  const remaining = activeItems(order);
  if (remaining.some((item) => item.deliveredAt)) {
    throw new AppError(400, "Part of this order was already delivered — cancel the other parts one by one");
  }
  await cancelItems(order, remaining, "order cancelled");
};

/* ---------- cash on delivery ---------- */

/* store (or admin for site items) confirms the cash → paid, completes the part the buyer already confirmed */
const markCashCollected = async (order, items, userId) => {
  if (order.paymentMethod !== "cash") {
    throw new AppError(400, "This order wasn't paid in cash");
  }
  if (!["processing", "shipped"].includes(order.status)) {
    throw new AppError(400, `Cash can't be confirmed on a ${order.status} order`);
  }

  const open = items.filter((item) => !item.cashCollectedAt && !item.cancelledAt);
  if (!open.length) throw new AppError(409, "The cash for these items is already confirmed");
  if (open.some((item) => !isShipped(item))) {
    throw new AppError(400, "Ship the items first — cash is paid on delivery");
  }

  const now = new Date();
  for (const item of open) {
    item.cashCollectedAt = now;
    item.cashCollectedBy = userId;
  }
  order.markModified("items");

  // all items confirmed → paid
  const allCollected = activeItems(order).every((item) => item.cashCollectedAt);
  if (allCollected) order.paymentStatus = "paid";
  await order.save();

  // buyer already confirmed these → complete them now, otherwise auto-complete later
  const confirmed = open.filter((item) => item.buyerConfirmedAt);
  if (confirmed.length) await completeItems(order, confirmed);

  return { order, paid: allCollected, completed: order.status === "completed" };
};

/* store (or admin for site items) says the cash never arrived → cancel that part, or dispute for admin */
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

  const open = items.filter((item) => !item.cashCollectedAt && !item.cancelledAt);
  if (!open.length) throw new AppError(409, "You already confirmed the cash for these items");
  if (open.some((item) => !isShipped(item))) {
    throw new AppError(400, "Ship the items first — cash is paid on delivery");
  }

  // too early → the parcel may still be on its way
  if (open.some((item) => deliveryDueAt(item) && Date.now() < deliveryDueAt(item))) {
    throw new AppError(400, "You can report missing cash only after the delivery time");
  }

  // buyer never confirmed this part → parcel was refused, cancel this part
  if (!open.some((item) => item.buyerConfirmedAt)) {
    await cancelItems(order, open, "cash not received");
    return { order, outcome: "cancelled" };
  }

  // buyer says they got it → admin decides
  order.cashDispute = {
    reportedAt: new Date(),
    reportedBy: userId,
    note: note || null,
    group: groupKey(open[0]),
  };
  await order.save();
  return { order, outcome: "disputed" };
};

/* ---------- shipping ---------- */

const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;
  const active = activeItems(order);
  if (active.length && active.every(isShipped)) {
    order.status = "shipped";
    order.shippedAt = order.shippedAt || new Date();
  }
};

const markItemShipped = (item, trackingCode, estimatedDeliveryAt = null) => {
  if (item.cancelledAt) throw new AppError(400, "This item was cancelled");
  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
    estimatedDeliveryAt: estimatedDeliveryAt || null,
  };
};

/** order.expectedDeliveryAt = the latest arrival time among the items that have one */
const refreshExpectedDelivery = (order) => {
  const times = activeItems(order)
    .map((item) => item.fulfillment?.estimatedDeliveryAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  order.expectedDeliveryAt = times.length ? new Date(Math.max(...times)) : null;
};

/** changes the expected arrival of an item that already shipped */
const setItemDeliveryEstimate = (order, item, estimatedDeliveryAt) => {
  if (["completed", "cancelled"].includes(order.status) || item.deliveredAt || item.cancelledAt) {
    throw new AppError(400, "The delivery time of this item can't be changed anymore");
  }
  if (!isShipped(item)) {
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
  DAY_MS,
  groupKey,
  groupKeys,
  groupItems,
  activeItems,
  deliveryDueAt,
  reserveStock,
  finalizeOrder,
  completeItems,
  completeDeliveredOrder,
  releaseItemFunds,
  cancelItems,
  revertOrder,
  markCashCollected,
  reportCashNotReceived,
  buildOrderIdSearchExpr,
  maybeMarkOrderShipped,
  markItemShipped,
  refreshExpectedDelivery,
  setItemDeliveryEstimate,
  assertShippable,
};
