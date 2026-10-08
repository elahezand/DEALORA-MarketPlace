const Order = require("../../models/order");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const {
  buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable, revertOrder,
  finalizeOrder, completeDeliveredOrder, refreshExpectedDelivery, setItemDeliveryEstimate,
  markCashCollected, reportCashNotReceived,
} = require("../shared/order");
const { notifyCashNotReceived } = require("../shared/cashNotice");
const { notifyItemShipped, notifyDeliveryUpdated } = require("../shared/deliveryNotice");
const { buildListQuery, listLimit, dateRangeFilter } = require("../../utils/listQuery");


const getAllOrders = async (query = {}) => {
  const limit = listLimit(query, 20);
  const filters = buildListQuery(query, {
    statuses: ["created", "processing", "shipped", "completed", "cancelled"],
    ids: { user: "user", store: "items.store" },
  });
  if (!query.status || query.status === "all") filters.status = { $ne: "cancelled" };
  if (query.paymentStatus && query.paymentStatus !== "all") filters.paymentStatus = query.paymentStatus;
  if (query.paymentMethod && query.paymentMethod !== "all") filters.paymentMethod = query.paymentMethod;

  // cash orders an admin has to look at: nobody confirmed the cash in time, or a dispute
  if (query.overdueCash === "true") {
    const { overdueCashQuery } = require("../shared/orderSweeper");
    const { $or, ...rest } = overdueCashQuery();
    Object.assign(filters, rest);
    filters.$and = [...(filters.$and || []), { $or }];
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
      ["processing", "shipped"].includes(order.status) &&
      order.paymentMethod === "cash" &&
      order.paymentStatus === "pending" &&
      !!order.cashOverdueNotifiedAt,
    isCashDisputed:
      ["processing", "shipped"].includes(order.status) &&
      order.paymentMethod === "cash" &&
      !!order.cashDispute?.reportedAt,
  }));

  return { data, pagination: result.pagination };
};

const adminShipItem = async (orderId, itemId, trackingCode, estimatedDeliveryAt = null) => {
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

  markItemShipped(item, trackingCode, estimatedDeliveryAt);
  order.markModified("items");
  refreshExpectedDelivery(order);
  maybeMarkOrderShipped(order);
  await order.save();

  await notifyItemShipped(order, item);
  return order;
};

/* admin can change the expected arrival of ANY shipped item (theirs or a seller's) */
const adminSetDeliveryEstimate = async (orderId, itemId, estimatedDeliveryAt) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new AppError(404, "Item not found in this order");

  setItemDeliveryEstimate(order, item, estimatedDeliveryAt);
  await order.save();

  await notifyDeliveryUpdated(order, item);
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

const ADMIN_UPDATABLE_FIELDS = ["paymentStatus", "status"];

/*
 * Status moves an admin may make by hand — only cancelling.
 * Completing an order is NOT an admin action:
 *  - online orders: the buyer confirms receipt, or the system completes them automatically
 *  - cash orders: the buyer confirms, or whoever received the cash confirms it
 *    (the store for its items, an admin only for the site's own items)
 * A completed order can't be cancelled: the seller was already paid, a refund would pay twice.
 */
const ALLOWED_STATUS_MOVES = {
  created: ["cancelled"],
  processing: ["cancelled"],
  shipped: ["cancelled"],
  completed: [],
  cancelled: [],
};

// payment status an admin may set by hand (paid/refunded are set by the payment flows,
// cash is confirmed through "cash received")
const ALLOWED_PAYMENT_MOVES = {
  pending: ["failed"],
  failed: [],
  paid: [],
  refunded: [],
};

const assertAdminOrderChange = (order, data) => {
  if (data.status && data.status !== order.status) {
    const allowed = ALLOWED_STATUS_MOVES[order.status] || [];
    if (!allowed.includes(data.status)) {
      throw new AppError(400, `An order can't go from "${order.status}" to "${data.status}"`);
    }
  }

  if (data.paymentStatus && data.paymentStatus !== order.paymentStatus) {
    // cash payments are only confirmed by whoever received the money ("cash received")
    const allowed = order.paymentMethod === "cash" ? [] : ALLOWED_PAYMENT_MOVES[order.paymentStatus] || [];
    if (!allowed.includes(data.paymentStatus)) {
      throw new AppError(400, `Payment status can't go from "${order.paymentStatus}" to "${data.paymentStatus}"`);
    }
  }
};

const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  assertAdminOrderChange(order, data);

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

/*
 * Cash on delivery for the SITE's own items (and personal ads): an admin confirms the money
 * arrived. A store's items are confirmed by that store — the admin never received that cash.
 */
const adminConfirmCash = async (orderId, itemId, adminId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new AppError(404, "Item not found in this order");
  if (item.store) {
    throw new AppError(403, "This item's cash was paid to the store — only the store can confirm it");
  }

  return markCashCollected(order, [item], adminId);
};

/* the SITE did not receive the cash for one of its own items */
const adminReportCashMissing = async (orderId, itemId, adminId, note) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new AppError(404, "Item not found in this order");
  if (item.store) {
    throw new AppError(403, "This item's cash was paid to the store — only the store can report it");
  }

  const result = await reportCashNotReceived(order, [item], adminId, note);
  await notifyCashNotReceived(result.order, result.outcome);
  return result;
};

module.exports = {
  ALLOWED_STATUS_MOVES,
  adminSetDeliveryEstimate,
  adminConfirmCash,
  adminReportCashMissing,
  runAutoComplete,
  getStuckOrders,
  repairOrder,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  adminShipItem,
};
