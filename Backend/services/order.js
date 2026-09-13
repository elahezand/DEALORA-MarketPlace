const { Types } = require("mongoose");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Listing = require("../models/listing");
const Coupon = require("../models/coupon");
const Store = require("../models/store");
const { paginate,escapeRegex } = require("../utils/helper");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const {
  createPayment,
  verifyPayment,
} = require("../services/zarinpal");
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

/* Checkout: Cart → Order */
const checkout = async (userId, shippingAddress, paymentMethod) => {
  const cart = await Cart.findOne({
    user: userId,
    status: "active",
  }).populate("items.product items.offer");

  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Cart is empty");
  }

  const orderItems = cart.items.map((item) => {
    const seller = item.store || item.offer?.store || null;
    const shipsWithinDays = item.offer?.shipsWithinDays ?? 3;
    const estimatedShipBy = new Date(
      Date.now() + shipsWithinDays * 24 * 60 * 60 * 1000
    );
    return {
      product: item.product,
      variant: item.variantId,
      quantity: item.quantity,
      price: item.priceSnapshot || 0,
      seller,
      estimatedShipBy,
      needsAdminShipment: !seller && item.product?.listingType === "store_product",
    };
  });

  const order = await Order.create({
    user: cart.user,
    items: orderItems,
    coupon: cart.coupon,
    pricing: cart.pricing,
    shippingAddress,
    paymentMethod,
    paymentStatus: "pending",
    status: "created",
  });

  let paymentUrl = null;

  if (paymentMethod === "zarinpal") {
    const payment = await createPayment(
      order.pricing.total * 10,
      `Order ${order._id}`
    );

    if (!payment?.data?.authority) {
      throw new AppError(500, "Payment init failed");
    }

    order.payment = {
      authority: payment.data.authority,
    };

    paymentUrl = `https://www.zarinpal.com/pg/StartPay/${payment.data.authority}`;

    await order.save();
  }
  cart.status = "converted";
  await cart.save();

  return {
    order,
    paymentUrl,
  };
};

const verify = async (authority) => {
  const order = await Order.findOne({
    "payment.authority": authority,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  const result = await verifyPayment(authority, order.pricing.total * 10);

  if (!result.success) {
    order.paymentStatus = "failed";
    await order.save();
    return order;
  }

  order.paymentStatus = "paid";
  order.payment.refId = result.refId;
  order.payment.paidAt = new Date();
  order.status = "processing";


  if (order.coupon?.couponRef) {
    await Coupon.updateOne(
      { _id: order.coupon.couponRef },
      { $inc: { usedCount: 1 } }
    );
  }

  await Promise.all(
    order.items.map(async (item) => {
      let result;

      if (item.variant) {
        result = await Listing.updateOne(
          {
            _id: item.product,
            "variants._id": item.variant,
            "variants.stock": { $gte: item.quantity },
          },
          {
            $inc: {
              "metrics.sold": item.quantity,
              "variants.$[elem].stock": -item.quantity,
            },
          },
          {
            arrayFilters: [{ "elem._id": new Types.ObjectId(item.variant) }],
          }
        );
      } else {
        result = await Listing.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { "metrics.sold": item.quantity, stock: -item.quantity } }
        );
      }

      if (result.modifiedCount === 0) {
        logger.error(
          `[order ${order._id}] stock update FAILED for product ${item.product} (variant: ${item.variant || "none"}, qty: ${item.quantity}) - payment was captured but stock could not be reserved; needs manual review/refund.`
        );
      }
    })
  );

  const revenueBySeller = new Map();
  for (const item of order.items) {
    if (!item.seller) continue;
    const key = String(item.seller);
    revenueBySeller.set(key, (revenueBySeller.get(key) || 0) + item.price * item.quantity);
  }
  await Promise.all(
    Array.from(revenueBySeller.entries()).map(([sellerId, amount]) =>
      Store.updateOne({ _id: sellerId }, { $inc: { "wallet.balance": amount } })
    )
  );

  await order.save();
  return order;
};
/* Admin Orders */
const getAllOrders = async (query = {}) => {
  const { limit, cursor } = query;
  if (limit && Number(limit) > 100) {
    const err = new Error("limit must be <= 100");
    err.status = 400;
    throw err;
  }

  const filters = {};

  if (query.needsAdminAction === "true" || query.needsAdminAction === true) {
    filters.items = {
      $elemMatch: {
        needsAdminShipment: true,
        "fulfillment.status": { $ne: "shipped" },
      },
    };
  }

  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) {
    filters.$expr = searchExpr;
  }

  const result = await paginate(Order, {
    limit: limit ? Number(limit) : 20,
    cursor,
    filters,
    sort: { createdAt: -1 },
  });

  const data = result.data.map((order) => ({
    ...order,
    hasPendingAdminItems: order.items.some(
      (item) => item.needsAdminShipment && item.fulfillment?.status !== "shipped"
    ),
  }));

  return { data, pagination: result.pagination };
};

/* User Orders */
const getMyOrders = async (userId, query = {}) => {
  const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  const filters = {
    user: userId,
  };
  if (query.status && query.status !== "all") {
    filters.status = query.status;
  }
  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) {
    filters.$expr = searchExpr;
  }

  return paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { createdAt: -1 },
  });
};

/* Seller Orders — orders containing at least one of this seller's items */
const getSellerOrders = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) {
    throw new AppError(404, "Store not found");
  }

  const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  const filters = {
    "items.seller": store._id,
    paymentStatus: "paid",
  };
  if (query.status && query.status !== "all") {
    filters.status = query.status;
  }
  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) {
    filters.$expr = searchExpr;
  }

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { createdAt: -1 },
    populate: [
      { path: "user", select: "username phone" },
      { path: "items.product", select: "title images" },
    ],
  });

  const data = result.data.map((order) => {
    const myItems = order.items.filter(
      (item) => item.seller && String(item.seller) === String(store._id)
    );
    const mySubtotal = myItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippedCount = myItems.filter((item) => item.fulfillment?.status === "shipped").length;
    const myFulfillmentStatus =
      shippedCount === 0 ? "pending" : shippedCount === myItems.length ? "shipped" : "partial";

    return { ...order, items: myItems, mySubtotal, myFulfillmentStatus };
  });

  return { data, pagination: result.pagination };
};

/* Once every item in the order has been shipped, flip the overall
   order status to "shipped" too, so the buyer gets notified without
   an admin having to do it manually as a separate step. */
const maybeMarkOrderShipped = (order) => {
  if (["shipped", "completed", "cancelled"].includes(order.status)) return;

  const allShipped = order.items.every(
    (item) => item.fulfillment?.status === "shipped"
  );
  if (allShipped) {
    order.status = "shipped";
  }
};

/* Seller — mark ONE of this seller's items in an order as shipped. */
const sellerShipItem = async (userId, orderId, itemId, trackingCode) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) {
    throw new AppError(404, "Store not found");
  }

  const order = await Order.findOne({
    _id: orderId,
    "items.seller": store._id,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status === "created" || order.status === "cancelled") {
    throw new AppError(
      400,
      `Order cannot be marked as shipped from status "${order.status}"`
    );
  }

  const item = order.items.id(itemId);
  if (!item || !item.seller || String(item.seller) !== String(store._id)) {
    throw new AppError(404, "Item not found in this order");
  }

  if (item.fulfillment?.status === "shipped") {
    throw new AppError(409, "This item is already marked as shipped");
  }

  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
  };

  order.markModified("items");
  maybeMarkOrderShipped(order);
  await order.save();
  return order;
};


const adminShipItem = async (orderId, itemId, trackingCode) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status === "created" || order.status === "cancelled") {
    throw new AppError(
      400,
      `Order cannot be marked as shipped from status "${order.status}"`
    );
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new AppError(404, "Item not found in this order");
  }

  if (item.fulfillment?.status === "shipped") {
    throw new AppError(409, "This item is already marked as shipped");
  }

  if (!item.needsAdminShipment) {
    throw new AppError(
      403,
      "This item belongs to a seller — only they can mark it as shipped"
    );
  }

  item.fulfillment = {
    status: "shipped",
    trackingCode: trackingCode || item.fulfillment?.trackingCode || null,
    shippedAt: new Date(),
  };

  order.markModified("items");
  maybeMarkOrderShipped(order);
  await order.save();
  return order;
};

/* User Single Order */
const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return order;
};


/* Admin Single Order */
const getOrderByIdAdmin = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "username phone")
    .populate("items.product", "title images")
    .populate("items.seller", "name slug");

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return order;
};

const ADMIN_UPDATABLE_FIELDS = ["paymentStatus", "status", "isDelivered", "deliveredAt"];
const OWNER_UPDATABLE_FIELDS = ["shippingAddress"];

/* Update Order (Admin — full access, but still whitelisted).
   Note: "shipped" is intentionally not in ADMIN_UPDATABLE status options
   anymore — it's set automatically by maybeMarkOrderShipped() once every
   item has been shipped by its seller/admin. */
const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  for (const field of ADMIN_UPDATABLE_FIELDS) {
    if (data[field] !== undefined) {
      order[field] = data[field];
    }
  }

  return order.save();
};

const updateOrderByOwner = async (orderId, userId, data) => {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (["shipped", "completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, "Order can no longer be modified");
  }

  for (const field of OWNER_UPDATABLE_FIELDS) {
    if (data[field] !== undefined) {
      order[field] = { ...order[field]?.toObject?.(), ...data[field] };
    }
  }

  return order.save();
};

/* Cancel Order */
const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (["shipped", "completed"].includes(order.status)) {
    throw new AppError(400, "Order cannot be cancelled");
  }

  order.status = "cancelled";

  return order.save();
};

/* Buyer confirms they received the order. */
const confirmDelivery = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status !== "shipped") {
    throw new AppError(
      409,
      `Order can only be confirmed as received from "shipped" status (currently "${order.status}")`
    );
  }

  order.status = "completed";
  order.isDelivered = true;
  order.deliveredAt = new Date();

  return order.save();
};

module.exports = {
  checkout,
  verify,
  getMyOrders,
  getSellerOrders,
  sellerShipItem,
  adminShipItem,
  getOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  updateOrderByOwner,
  cancelOrder,
  confirmDelivery,
};