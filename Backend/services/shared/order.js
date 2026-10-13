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

const groupKey = (item) => (item.store ? String(item.store) : "site");
const groupKeys = (order) => [...new Set(activeItems(order).map(groupKey))];
const groupItems = (order, key) => activeItems(order).filter((item) => groupKey(item) === key);

const activeItems = (order) => (order.items || []).filter((item) => !item.cancelledAt);

const itemValue = (item) => item.finalPrice * item.quantity;
const isShipped = (item) => item.fulfillment?.status === "shipped";

// WHEN THE ITEM SHOULD ARRIVE (NO TIME SET → 3 DAYS AFTER SHIPPING)
const deliveryDueAt = (item) => {
  if (item.fulfillment?.estimatedDeliveryAt) return new Date(item.fulfillment.estimatedDeliveryAt);
  const shippedAt = item.fulfillment?.shippedAt;
  return shippedAt ? new Date(new Date(shippedAt).getTime() + 3 * DAY_MS) : null;
};

/* ---------- STOCK ---------- */
// TAKE STOCK ONLY IF THERE IS ENOUGH (CHECK + TAKE IN ONE STEP)
const takeStock = async (item) => {
  // SELLER PRODUCT → STOCK IS ON THE OFFER
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

  // SITE PRODUCT → STOCK IS ON THE VARIANT
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

  // NO STOCK TO COUNT
  return true;
};

// CANCELLED → PUT THE STOCK BACK, SOLD COUNT DOWN
const giveStockBack = async (item) => {
  // SELLER PRODUCT
  if (item.offer) {
    const result = await OfferSeller.updateOne({ _id: item.offer }, { $inc: { stock: item.quantity } });

    if (result.modifiedCount) {
      await Listing.updateOne({ _id: item.productId }, { $inc: { "metrics.sold": -item.quantity } });
    }
    return result.modifiedCount > 0;
  }

  // SITE PRODUCT
  if (item.variantId) {
    const result = await Listing.updateOne(
      { _id: item.productId },
      { $inc: { "metrics.sold": -item.quantity, "variants.$[elem].stock": item.quantity } },
      { arrayFilters: [{ "elem._id": new Types.ObjectId(item.variantId) }] }
    );
    return result.modifiedCount > 0;
  }

  return true;
};



/* ---------- BEFORE PAYMENT ---------- */
// HOLD STOCK BEFORE PAYMENT — OUT OF STOCK = ERROR
const reserveStock = async (order) => {
  for (const item of order.items) {
    // ALREADY HELD OR CANCELLED → SKIP
    if (item.stockReserved || item.cancelledAt) continue;

    const ok = await takeStock(item);
    if (!ok) throw new AppError(409, `"${item.productSnapshot.title}" is out of stock`);

    item.stockReserved = true;
    await order.save();
  }
};
// TAKE ONE COUPON USE BEFORE PAYMENT — LIKE STOCK, CHECK + COUNT IN ONE STEP
const reserveCoupon = async (order) => {
  if (!order.coupon?.couponId || order.couponCounted) return;

  const now = new Date();
  const result = await Coupon.updateOne(
    {
      _id: order.coupon.couponId,
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
        { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
      ],
    },
    { $inc: { usedCount: 1 } }
  );
  if (!result.modifiedCount) throw new AppError(409, "This coupon can't be used anymore");

  order.couponCounted = true;
  await order.save();
};




/* ---------- AFTER PAYMENT ---------- */
// AFTER PAYMENT: HOLD SELLER MONEY, ORDER → PROCESSING
const finalizeOrder = async (order) => {
  if (order.coupon?.couponId && !order.couponCounted) {
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: 1 } });
    order.couponCounted = true;
    await order.save();
  }

  for (const item of order.items) {
    if (item.cancelledAt) continue;

    if (!item.stockReserved) {
      const ok = await takeStock(item);
      if (!ok) {
        logger.error(`[order ${order._id}] stock update FAILED for product ${item.productId} - needs manual review/refund.`);
      }
      item.stockReserved = true;
      await order.save();
    }

    // SELLER MONEY — ONCE PER ITEM
    if (item.store && !item.walletCredited) {
      if (order.paymentMethod === "cash") {
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




/* ---------- DELIVERY ---------- */
// SELLER MONEY: PENDING → BALANCE. FLAG FIRST, SO IT'S NEVER PAID TWICE
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

// ALL PARTS DELIVERED → WHOLE ORDER COMPLETED
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

// COMPLETE SOME ITEMS → RELEASE SELLER MONEY → MAYBE COMPLETE THE ORDER
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






/* ---------- CANCELLING ---------- */
// HOW MUCH TO GIVE BACK: SHARE OF WHAT THE BUYER REALLY PAID
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

// CANCEL SOME ITEMS: BUYER REFUND, SELLER MONEY BACK, STOCK BACK
const cancelItems = async (order, items, reason = null) => {
  const open = items.filter((item) => !item.cancelledAt);
  if (!open.length) return 0;
  if (open.some((item) => item.deliveredAt)) {
    throw new AppError(400, "Delivered items can't be cancelled");
  }

  const isLast = activeItems(order).every((item) => open.includes(item));
  const refund = refundShare(order, open, isLast);
  const now = new Date();

  if (refund > 0) {
    const key = `cancel:${order._id}:${open.map((item) => String(item._id)).sort().join(",")}`;
    const given = await refundPartToWallet(order.user, order._id, key, refund, "order cancelled");
    order.refundAmount = round2((order.refundAmount || 0) + given);
    if (given > 0) order.refundedAt = now;
  }

  for (const item of open) {
    if (item.store && item.walletCredited && !item.walletReleased) {
      await Store.updateOne({ _id: item.store }, { $inc: { "wallet.pending": -itemValue(item) } });
      item.walletCredited = false;
    }
    // STOCK BACK
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
    // WHOLE ORDER CANCELLED → COUPON BACK
    if (order.coupon?.couponId && order.couponCounted) {
      await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: -1 } });
      order.couponCounted = false;
    }
    if (order.paymentStatus === "paid" && order.paymentMethod !== "cash") order.paymentStatus = "refunded";
    order.status = "cancelled";
    order.revertedAt = now;
  } else {
    // REST OF THE ORDER GOES ON
    maybeMarkOrderShipped(order);
    // CASH: REST ALREADY PAID → ORDER PAID
    if (order.paymentMethod === "cash" && activeItems(order).every((item) => item.cashCollectedAt)) {
      order.paymentStatus = "paid";
    }
  }

  await order.save();
  if (!isLast) await maybeCompleteOrder(order);
  return refund;
};

// CANCEL THE WHOLE ORDER (EVERYTHING LEFT). ONLY ONCE
const revertOrder = async (order) => {
  if (order.revertedAt) return;
  const remaining = activeItems(order);
  if (remaining.some((item) => item.deliveredAt)) {
    throw new AppError(400, "Part of this order was already delivered — cancel the other parts one by one");
  }
  await cancelItems(order, remaining, "order cancelled");
};



/* ---------- CASH ON DELIVERY ---------- */
// STORE (OR ADMIN FOR SITE ITEMS) GOT THE CASH → PAID, COMPLETE WHAT THE BUYER CONFIRMED
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

  // ALL CASH IN → ORDER PAID
  const allCollected = activeItems(order).every((item) => item.cashCollectedAt);
  if (allCollected) order.paymentStatus = "paid";
  await order.save();

  // BUYER ALREADY CONFIRMED → COMPLETE NOW
  const confirmed = open.filter((item) => item.buyerConfirmedAt);
  if (confirmed.length) await completeItems(order, confirmed);

  return { order, paid: allCollected, completed: order.status === "completed" };
};

// CASH NEVER CAME → CANCEL THE PART, OR DISPUTE FOR ADMIN
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

  // TOO EARLY → PARCEL MAY STILL BE ON THE WAY
  if (open.some((item) => deliveryDueAt(item) && Date.now() < deliveryDueAt(item))) {
    throw new AppError(400, "You can report missing cash only after the delivery time");
  }

  // BUYER NEVER CONFIRMED → PARCEL REFUSED → CANCEL THIS PART
  if (!open.some((item) => item.buyerConfirmedAt)) {
    await cancelItems(order, open, "cash not received");
    return { order, outcome: "cancelled" };
  }

  // BUYER SAYS GOT IT → ADMIN DECIDES
  order.cashDispute = {
    reportedAt: new Date(),
    reportedBy: userId,
    note: note || null,
    group: groupKey(open[0]),
  };
  await order.save();
  return { order, outcome: "disputed" };
};




/* ---------- SHIPPING ---------- */

// MARK ONE ITEM AS SHIPPED
const markItemShipped = (item, trackingCode, estimatedDeliveryAt = null) => {
  if (item.cancelledAt) throw new AppError(400, "This item was cancelled");
  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
    estimatedDeliveryAt: estimatedDeliveryAt || null,
  };
};

// EVERY ITEM SHIPPED → WHOLE ORDER SHIPPED
const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;
  const active = activeItems(order);
  if (active.length && active.every(isShipped)) {
    order.status = "shipped";
    order.shippedAt = order.shippedAt || new Date();
  }
};

// ORDER ARRIVAL TIME = THE LATEST ONE AMONG ITS ITEMS
const refreshExpectedDelivery = (order) => {
  const times = activeItems(order)
    .map((item) => item.fulfillment?.estimatedDeliveryAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  order.expectedDeliveryAt = times.length ? new Date(Math.max(...times)) : null;
};

// UNPAID OR CANCELLED → CAN'T SHIP
const assertShippable = (order) => {
  if (order.status === "created" || order.status === "cancelled") {
    throw new AppError(400, `Order cannot be marked as shipped from status "${order.status}"`);
  }
};

// SHIP ONE STORE'S PART TOGETHER: SAME TRACKING CODE + ARRIVAL TIME
const shipItems = (order, items, trackingCode, estimatedDeliveryAt = null) => {
  assertShippable(order);
  const pending = items.filter((item) => !item.cancelledAt && !isShipped(item));
  if (!pending.length) throw new AppError(409, "Everything here is already shipped");

  for (const item of pending) markItemShipped(item, trackingCode, estimatedDeliveryAt);
  order.markModified("items");

  refreshExpectedDelivery(order);
  maybeMarkOrderShipped(order);
  return pending;
};

// CHANGE ARRIVAL TIME OF ONE STORE'S SHIPPED PART
const setItemsDeliveryEstimate = (order, items, estimatedDeliveryAt) => {
  if (["completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, "The delivery time of this order can't be changed anymore");
  }
  const open = items.filter((item) => !item.cancelledAt && !item.deliveredAt && isShipped(item));
  if (!open.length) throw new AppError(400, "Ship the items first, then set their delivery time");

  for (const item of open) item.fulfillment.estimatedDeliveryAt = estimatedDeliveryAt;
  order.markModified("items");
  refreshExpectedDelivery(order);
  return open;
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
  releaseItemFunds,
  cancelItems,
  revertOrder,
  markCashCollected,
  reportCashNotReceived,
  buildOrderIdSearchExpr,
  maybeMarkOrderShipped,
  markItemShipped,
  refreshExpectedDelivery,
  shipItems,
  setItemsDeliveryEstimate,
  assertShippable,
  reserveCoupon
};