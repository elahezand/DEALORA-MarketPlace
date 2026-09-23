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
  // 1) coupon usage — once per order
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
      await Store.updateOne(
        { _id: item.store },
        { $inc: { "wallet.pending": item.finalPrice * item.quantity } }
      );
      item.walletCredited = true;
      await order.save();
    }
  }
  order.status = "processing";
};

/*
 * Buyer received the order → the held money becomes withdrawable.
 * Each item is released once, so calling this again changes nothing.
 */
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

/*
 * Order cancelled before delivery → give the stock back, drop the held money
 * and give the coupon use back. Runs once (revertedAt).
 */
const revertOrder = async (order) => {
  if (order.revertedAt) return;

  for (const item of order.items) {
    // money is only reverted while it is still held
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

/*
 * Buyers often never press "I received it". A shipped order is completed
 * automatically after AUTO_COMPLETE_DAYS so sellers still get paid.
 */
const AUTO_COMPLETE_DAYS = Number(process.env.ORDER_AUTO_COMPLETE_DAYS || 7);
const autoCompleteShippedOrders = async () => {
  const deadline = new Date(Date.now() - AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000);

  const orders = await Order.find({
    status: "shipped",
    shippedAt: { $lte: deadline },
  }).limit(200);

  for (const order of orders) {
    order.status = "completed";
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
    order.autoCompletedAt = new Date();
    await order.save();

    await releaseOrderFunds(order);
    logger.info(`[order ${order._id}] auto-completed after ${AUTO_COMPLETE_DAYS} days, seller funds released`);
  }

  return orders.length;
};

const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;
  const allShipped = order.items.every((item) => item.fulfillment?.status === "shipped");
  if (allShipped) {
    order.status = "shipped";
    order.shippedAt = order.shippedAt || new Date();
  }
};

const markItemShipped = (item, trackingCode) => {
  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
  };
};

const assertShippable = (order) => {
  if (order.status === "created" || order.status === "cancelled") {
    throw new AppError(400, `Order cannot be marked as shipped from status "${order.status}"`);
  }
};

module.exports = {
  autoCompleteShippedOrders,
  releaseOrderFunds,
  revertOrder,
  buildOrderIdSearchExpr,
  finalizeOrder,
  maybeMarkOrderShipped,
  markItemShipped,
  assertShippable,
};
