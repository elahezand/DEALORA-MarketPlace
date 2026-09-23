const Order = require("../../models/order");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { finalizeOrder } = require("../shared/order");
const { buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable, releaseOrderFunds, revertOrder, autoCompleteShippedOrders } = require("../shared/order");
const { buildDateFilter, getAdminSort } = require("../../utils/adminQuery");

const getAllOrders = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 20, 100);
  const filters = {};

  if (query.needsAdminAction === "true" || query.needsAdminAction === true) {
    filters.items = {
      $elemMatch: {
        needsAdminShipment: true,
        "fulfillment.status": { $ne: "shipped" },
      },
    };
  }

  if (query.status && query.status !== "all") filters.status = query.status;
  if (query.paymentStatus && query.paymentStatus !== "all") filters.paymentStatus = query.paymentStatus;
  if (query.paymentMethod && query.paymentMethod !== "all") filters.paymentMethod = query.paymentMethod;
  Object.assign(filters, buildDateFilter(query, "createdAt"));
  if (!query.status || query.status === "all") {
    filters.status = { $ne: "cancelled" };
  }
  
  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    sort: getAdminSort(query, ["createdAt", "updatedAt"])
  });

  const data = result.data.map((order) => ({
    ...order,
    hasPendingAdminItems: order.items.some(
      (item) => item.needsAdminShipment && item.fulfillment?.status !== "shipped"
    ),
  }));

  return { data, pagination: result.pagination };
};

const adminShipItem = async (orderId, itemId, trackingCode) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  assertShippable(order);

  const item = order.items.id(itemId);
  if (!item) throw new AppError(404, "Item not found in this order");
  if (item.fulfillment?.status === "shipped") {
    throw new AppError(409, "This item is already marked as shipped");
  }
  if (!item.needsAdminShipment) {
    throw new AppError(403, "This item belongs to a seller — only they can mark it as shipped");
  }

  markItemShipped(item, trackingCode);
  order.markModified("items");
  maybeMarkOrderShipped(order);
  await order.save();
  return order;
};

const getOrderByIdAdmin = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "username phone")
    .populate("items.productId", "title images")
    .populate("items.store", "name slug");

  if (!order) throw new AppError(404, "Order not found");
  return order;
};

const ADMIN_UPDATABLE_FIELDS = ["paymentStatus", "status", "isDelivered", "deliveredAt"];

const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  const wasStatus = order.status;

  for (const field of ADMIN_UPDATABLE_FIELDS) {
    if (data[field] !== undefined) order[field] = data[field];
  }
  await order.save();

  // same money rules as the buyer's own actions
  if (wasStatus !== "completed" && order.status === "completed") {
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
    await order.save();
    await releaseOrderFunds(order);
  }
  if (wasStatus !== "cancelled" && order.status === "cancelled") {
    await revertOrder(order);
  }

  return order;
};

/* Paid orders whose finalize never completed (server died mid-way) */
const getStuckOrders = async () => {
  const orders = await Order.find({
    // the money step started but never finished — whatever the payment method
    finalizedAt: { $ne: null },
    status: { $ne: "cancelled" },
    $or: [
      { "items.stockReserved": false },
      { items: { $elemMatch: { store: { $ne: null }, walletCredited: false } } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100);

  return { data: orders, pagination: { limit: 100, nextCursor: null, hasMore: false } };
};

/* Finishes the remaining steps of one stuck order (safe to run again) */
const repairOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  if (!order.finalizedAt) {
    throw new AppError(400, "This order never reached the payment step");
  }
  if (order.paymentMethod !== "cash" && order.paymentStatus !== "paid") {
    throw new AppError(400, "This order is not paid yet");
  }

  await finalizeOrder(order);
  await order.save();
  return order;
};

/* Completes shipped orders the buyer never confirmed (also runs hourly by itself) */
const runAutoComplete = async () => {
  const { runOrderSweeps } = require("../shared/orderSweeper");
  return runOrderSweeps();
};

module.exports = {
  runAutoComplete,
  getStuckOrders,
  repairOrder,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  adminShipItem,
};
