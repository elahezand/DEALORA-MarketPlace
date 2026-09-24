const Order = require("../../models/order");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable, revertOrder, finalizeOrder, completeDeliveredOrder } = require("../shared/order");
const { buildListQuery, listLimit, dateRangeFilter } = require("../../utils/listQuery");

const OVERDUE_DAYS = Number(process.env.ORDER_AUTO_COMPLETE_DAYS || 7);

const getAllOrders = async (query = {}) => {
  const limit = listLimit(query, 20);
  const filters = buildListQuery(query, {
    statuses: ["created", "processing", "shipped", "completed", "cancelled"],
    ids: { user: "user", store: "items.store" },
  });
  if (!query.status || query.status === "all") filters.status = { $ne: "cancelled" };
  if (query.paymentStatus && query.paymentStatus !== "all") filters.paymentStatus = query.paymentStatus;
  if (query.paymentMethod && query.paymentMethod !== "all") filters.paymentMethod = query.paymentMethod;

  // shipped cash orders nobody confirmed in time → the admin decides
  if (query.overdueCash === "true") {
    const { overdueCashQuery } = require("../shared/orderSweeper");
    Object.assign(filters, overdueCashQuery());
  }

  if (query.needsAdminAction === "true" || query.needsAdminAction === true) {
    filters.items = {
      $elemMatch: {
        needsAdminShipment: true,
        "fulfillment.status": { $ne: "shipped" },
      },
    };
  }

  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { _id: -1 }
  });

  const data = result.data.map((order) => ({
    ...order,
    hasPendingAdminItems: order.items.some(
      (item) => item.needsAdminShipment && item.fulfillment?.status !== "shipped"
    ),
    isCashOverdue:
      order.status === "shipped" &&
      order.paymentMethod === "cash" &&
      order.paymentStatus === "pending" &&
      !!order.shippedAt &&
      Date.now() - new Date(order.shippedAt).getTime() >= OVERDUE_DAYS * 24 * 60 * 60 * 1000,
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
    await completeDeliveredOrder(order);
  }
  if (wasStatus !== "cancelled" && order.status === "cancelled") {
    await revertOrder(order);
  }

  return order;
};

/* Paid orders whose finalize never completed (server died mid-way) */
const getStuckOrders = async () => {
  const orders = await Order.find({
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

const markDelivered = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "shipped") {
    throw new AppError(400, "Only a shipped order can be marked as delivered");
  }

  await completeDeliveredOrder(order);
  return order;
};

module.exports = {
  markDelivered,
  runAutoComplete,
  getStuckOrders,
  repairOrder,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  adminShipItem,
};
