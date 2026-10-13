/* order — SELLER — store owners */
const Order = require("../../models/order");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const {
  buildOrderIdSearchExpr, shipItems, setItemsDeliveryEstimate, markCashCollected, reportCashNotReceived,
} = require("../shared/order");
const { notifyCashNotReceived } = require("../shared/cashNotice");
const { notifyItemsShipped, notifyDeliveryUpdated } = require("../shared/deliveryNotice");
const { buildListQuery, listLimit } = require("../../utils/listQuery");


// SELLER ORDERS: CONFIRMED ORDERS THAT HAVE THIS STORE'S ITEMS
const getSellerOrders = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const limit = listLimit(query, 20, 50);
  const searchExpr = buildOrderIdSearchExpr(query.q);

  const filters = buildListQuery(query, {
    base: {
      "items.store": store._id,
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cash", status: { $ne: "created" } }],
      ...(searchExpr ? { $expr: searchExpr } : {}),
    },
    statuses: ["processing", "shipped", "completed", "cancelled"],
    ids: { user: "user" },
  });



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
    const active = myItems.filter((item) => !item.cancelledAt);
   
    const mySubtotal = active.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
   
    const shippedCount = active.filter((item) => item.fulfillment?.status === "shipped").length;
   
    const myFulfillmentStatus =
      shippedCount === 0 ? "pending" : shippedCount === active.length ? "shipped" : "partial";

    let myStatus = "processing";
   
    if (!active.length) myStatus = "cancelled";
    else if (active.every((item) => item.deliveredAt)) myStatus = "completed";
    else if (shippedCount === active.length) myStatus = "shipped";

    return { ...order, items: myItems, mySubtotal, myFulfillmentStatus, myStatus };
  });

  return { data, pagination: result.pagination };
};

// THE SELLER'S ORDER + ITS OWN ITEMS IN IT, OR 404
const findSellerPart = async (userId, orderId) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const order = await Order.findOne({ _id: orderId, "items.store": store._id });
  if (!order) throw new AppError(404, "Order not found");

  const items = order.items.filter((item) => item.store && String(item.store) === String(store._id));
  return { order, items };
};

// SELLER SHIPS ALL ITS ITEMS OF THE ORDER TOGETHER
const sellerShipOrder = async (userId, orderId, trackingCode, estimatedDeliveryAt = null) => {
  const { order, items } = await findSellerPart(userId, orderId);

  const shipped = shipItems(order, items, trackingCode, estimatedDeliveryAt);
  await order.save();

  await notifyItemsShipped(order, shipped);
  return order;
};

// SELLER CHANGES WHEN ITS SHIPPED ITEMS SHOULD ARRIVE (COURIER DELAY, ...)
const sellerSetDeliveryEstimate = async (userId, orderId, estimatedDeliveryAt) => {
  const { order, items } = await findSellerPart(userId, orderId);

  const changed = setItemsDeliveryEstimate(order, items, estimatedDeliveryAt);
  await order.save();

  await notifyDeliveryUpdated(order, changed);
  return order;
};

// THE STORE RECEIVED THE CASH FOR ITS ITEMS IN THIS ORDER
const sellerConfirmCash = async (userId, orderId) => {
  const { order, items } = await findSellerPart(userId, orderId);
  return markCashCollected(order, items, userId);
};

// THE STORE DIDN'T RECEIVE THE CASH → PART CANCELLED, OR A DISPUTE FOR THE ADMINS
const sellerReportCashMissing = async (userId, orderId, note) => {
  const { order, items } = await findSellerPart(userId, orderId);

  const result = await reportCashNotReceived(order, items, userId, note);
  await notifyCashNotReceived(result.order, result.outcome);
  return result;
};

module.exports = {
  sellerConfirmCash,
  sellerReportCashMissing,
  getSellerOrders,
  sellerShipOrder,
  sellerSetDeliveryEstimate,
};