const { Types } = require("mongoose");
const Listing = require("../../models/listing");
const Coupon = require("../../models/coupon");
const Store = require("../../models/store");
const OfferSeller = require("../../models/offerSeller");
const { escapeRegex } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");

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
  order.status = "processing";

  if (order.coupon?.couponId) {
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: 1 } });
  }

  await Promise.all(
    order.items.map(async (item) => {
      let result;

      if (item.offer) {
        result = await OfferSeller.updateOne(
          { _id: item.offer, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        await Listing.updateOne({ _id: item.product }, { $inc: { "metrics.sold": item.quantity } });
      } else if (item.variantId) {
        result = await Listing.updateOne(
          {
            _id: item.product,
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
      } else {
        return;
      }

      if (result.modifiedCount === 0) {
        logger.error(
          `[order ${order._id}] stock update FAILED for product ${item.product} (offer: ${item.offer || "none"}, variantId: ${item.variantId || "none"}, qty: ${item.quantity}) - needs manual review/refund.`
        );
      }
    })
  );

  // credit each store with what the buyer paid for its items
  const revenueByStore = new Map();
  for (const item of order.items) {
    if (!item.store) continue;
    const key = String(item.store);
    revenueByStore.set(key, (revenueByStore.get(key) || 0) + item.finalPrice * item.quantity);
  }
  await Promise.all(
    Array.from(revenueByStore.entries()).map(([storeId, amount]) =>
      Store.updateOne({ _id: storeId }, { $inc: { "wallet.balance": amount } })
    )
  );
};

const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;
  const allShipped = order.items.every((item) => item.fulfillment?.status === "shipped");
  if (allShipped) order.status = "shipped";
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
  buildOrderIdSearchExpr,
  finalizeOrder,
  maybeMarkOrderShipped,
  markItemShipped,
  assertShippable,
};
