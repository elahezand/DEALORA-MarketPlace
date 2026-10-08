/* order — SELLER — store owners */
const Order = require("../../models/order");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const {
  buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable,
  refreshExpectedDelivery, setItemDeliveryEstimate, markCashCollected, reportCashNotReceived,
} = require("../shared/order");
const { notifyCashNotReceived } = require("../shared/cashNotice");
const { notifyItemShipped, notifyDeliveryUpdated } = require("../shared/deliveryNotice");
const { buildListQuery, listLimit } = require("../../utils/listQuery");

/* An order counts for the seller once it's confirmed:
   paid online, or cash on delivery (cash orders stay "pending" until delivery). */
const CONFIRMED_ORDER = {
  $or: [{ paymentStatus: "paid" }, { paymentMethod: "cash", status: { $ne: "created" } }],
};

/* Seller Orders — confirmed orders containing at least one of this store's items */
const getSellerOrders = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const limit = listLimit(query, 20, 50);

  const filters = buildListQuery(query, {
    base: { "items.store": store._id, ...CONFIRMED_ORDER },
    statuses: ["created", "processing", "shipped", "completed", "cancelled"],
  });

  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "username phone" },
      { path: "items.productId", select: "title images" },
    ],
    sort: { _id: -1 }
  });

  const data = result.data.map((order) => {
    const myItems = order.items.filter(
      (item) => item.store && String(item.store) === String(store._id)
    );
    const mySubtotal = myItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    const shippedCount = myItems.filter((item) => item.fulfillment?.status === "shipped").length;
    const myFulfillmentStatus =
      shippedCount === 0 ? "pending" : shippedCount === myItems.length ? "shipped" : "partial";

    return { ...order, items: myItems, mySubtotal, myFulfillmentStatus };
  });

  return { data, pagination: result.pagination };
};

/* Seller — mark ONE of their items as shipped */
/* the seller's own order + item, or 404 */
const findSellerItem = async (userId, orderId, itemId) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const order = await Order.findOne({ _id: orderId, "items.store": store._id });
  if (!order) throw new AppError(404, "Order not found");

  const item = order.items.id(itemId);
  if (!item || !item.store || String(item.store) !== String(store._id)) {
    throw new AppError(404, "Item not found in this order");
  }
  return { order, item };
};

const sellerShipItem = async (userId, orderId, itemId, trackingCode, estimatedDeliveryAt = null) => {
  const { order, item } = await findSellerItem(userId, orderId, itemId);

  assertShippable(order);
  if (item.fulfillment?.status === "shipped") {
    throw new AppError(409, "This item is already marked as shipped");
  }

  markItemShipped(item, trackingCode, estimatedDeliveryAt);
  order.markModified("items");
  refreshExpectedDelivery(order);
  maybeMarkOrderShipped(order);
  await order.save();

  await notifyItemShipped(order, item);
  return order;
};

/* the seller changes when a shipped item should arrive (courier delay, ...) */
const sellerSetDeliveryEstimate = async (userId, orderId, itemId, estimatedDeliveryAt) => {
  const { order, item } = await findSellerItem(userId, orderId, itemId);

  setItemDeliveryEstimate(order, item, estimatedDeliveryAt);
  await order.save();

  await notifyDeliveryUpdated(order, item);
  return order;
};

/* the store received the cash for its items in this order (cash on delivery) */
const sellerConfirmCash = async (userId, orderId) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const order = await Order.findOne({ _id: orderId, "items.store": store._id });
  if (!order) throw new AppError(404, "Order not found");

  const myItems = order.items.filter((item) => item.store && String(item.store) === String(store._id));
  const result = await markCashCollected(order, myItems, userId);
  return result;
};

/* the store did NOT receive the cash for its items → cancelled, or a dispute for the admins */
const sellerReportCashMissing = async (userId, orderId, note) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const order = await Order.findOne({ _id: orderId, "items.store": store._id });
  if (!order) throw new AppError(404, "Order not found");

  const myItems = order.items.filter((item) => item.store && String(item.store) === String(store._id));
  const result = await reportCashNotReceived(order, myItems, userId, note);
  await notifyCashNotReceived(result.order, result.outcome);
  return result;
};

module.exports = {
  sellerConfirmCash,
  sellerReportCashMissing,
  getSellerOrders,
  sellerShipItem,
  sellerSetDeliveryEstimate,
};
