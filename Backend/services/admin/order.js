const Order = require("../../models/order");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable } = require("../shared/order");

const getAllOrders = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 15, 100);
  const filters = {};

  if (query.needsAdminAction === "true" || query.needsAdminAction === true) {
    filters.items = {
      $elemMatch: {
        needsAdminShipment: true,
        "fulfillment.status": { $ne: "shipped" },
      },
    };
  }

  if (query.status) filters.status = query.status;
  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
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
    .populate("items.product", "title images")
    .populate("items.store", "name slug");

  if (!order) throw new AppError(404, "Order not found");
  return order;
};

const ADMIN_UPDATABLE_FIELDS = ["paymentStatus", "status", "isDelivered", "deliveredAt"];

const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  for (const field of ADMIN_UPDATABLE_FIELDS) {
    if (data[field] !== undefined) order[field] = data[field];
  }
  return order.save();
};

module.exports = {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  adminShipItem,
};
