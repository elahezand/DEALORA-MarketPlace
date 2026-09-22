/* order — SELLER — store owners */
const Order = require("../../models/order");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable } = require("../shared/order");

/* An order counts for the seller once it's confirmed:
   paid online, or cash on delivery (cash orders stay "pending" until delivery). */
const CONFIRMED_ORDER = {
  $or: [{ paymentStatus: "paid" }, { paymentMethod: "cash", status: { $ne: "created" } }],
};

/* Seller Orders — confirmed orders containing at least one of this store's items */
const getSellerOrders = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  const filters = { "items.store": store._id, ...CONFIRMED_ORDER };
  if (query.status && query.status !== "all") filters.status = query.status;

  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  const result = await paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "user", select: "username phone" },
      { path: "items.product", select: "title images" },
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
const sellerShipItem = async (userId, orderId, itemId, trackingCode) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const order = await Order.findOne({ _id: orderId, "items.store": store._id });
  if (!order) throw new AppError(404, "Order not found");

  assertShippable(order);

  const item = order.items.id(itemId);
  if (!item || !item.store || String(item.store) !== String(store._id)) {
    throw new AppError(404, "Item not found in this order");
  }
  if (item.fulfillment?.status === "shipped") {
    throw new AppError(409, "This item is already marked as shipped");
  }

  markItemShipped(item, trackingCode);
  order.markModified("items");
  maybeMarkOrderShipped(order);
  await order.save();
  return order;
};

module.exports = {
  getSellerOrders,
  sellerShipItem,
};
