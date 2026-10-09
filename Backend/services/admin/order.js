const Order = require("../../models/order");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const {
  buildOrderIdSearchExpr, maybeMarkOrderShipped, markItemShipped, assertShippable, revertOrder,
  refreshExpectedDelivery, setItemDeliveryEstimate, markCashCollected, reportCashNotReceived,
  cancelItems, groupItems, activeItems,
} = require("../shared/order");
const notifyUser = require("../../utils/notify");
const { notifyCashNotReceived } = require("../shared/cashNotice");
const { notifyItemShipped, notifyDeliveryUpdated } = require("../shared/deliveryNotice");
const { buildListQuery, listLimit } = require("../../utils/listQuery");
const { overdueCashQuery } = require("../shared/orderSweeper");

//GET ALL
const getAllOrders = async (query = {}) => {
  const limit = listLimit(query, 20);
  const filters = buildListQuery(query, {
    statuses: ["created", "processing", "shipped", "completed", "cancelled"],
    // not used in the panel yet
    ids: { user: "user", store: "items.store" },
  });

  // "All" tab: don't show cancelled orders
  if (!query.status || query.status === "all") filters.status = { $ne: "cancelled" };

  // not used in the panel yet
  if (query.paymentStatus && query.paymentStatus !== "all") filters.paymentStatus = query.paymentStatus;
  if (query.paymentMethod && query.paymentMethod !== "all") filters.paymentMethod = query.paymentMethod;

  // cash orders the admin should check
  if (query.overdueCash === "true") {
    const { $or, ...rest } = overdueCashQuery();
    Object.assign(filters, rest);
    filters.$and = [...(filters.$and || []), { $or }];
  }

  // site items waiting to be shipped by admin
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
    sort: { _id: -1 },
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
//GET ONE ORDER BY ID
const getOrderByIdAdmin = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "username phone")
    .populate("items.productId", "title images")
    .populate("items.store", "name slug");

  if (!order) throw new AppError(404, "Order not found");
  return order;
};

//SHIP BY ADMIN
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

//ADMIN CAN CHANGE THE EXPECTED ARRIVAL OF ANY SHIPPED ITEM (THEIRS AND SELLERS)
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



// ADMIN UPDATE ORDER (CANCEL WHOLE ORDER / FAIL PAYMENT)
const assertAdminOrderChange = (order, data) => {
  if (data.status && data.status !== order.status) {
    if (data.status !== "cancelled" || ["completed", "cancelled"].includes(order.status)) {
      throw new AppError(400, `An order can't go from "${order.status}" to "${data.status}"`);
    }
    if (activeItems(order).some((item) => item.deliveredAt)) {
      throw new AppError(400, "Part of this order was already delivered — cancel the other parts one by one");
    }
  }

  // PAID / REFUNDED ARE SET BY THE PAYMENT FLOWS, NOT BY HAND
  if (data.paymentStatus && data.paymentStatus !== order.paymentStatus) {
    const canFail =
      data.paymentStatus === "failed" &&
      order.paymentStatus === "pending" &&
      order.paymentMethod !== "cash";
    if (!canFail) {
      throw new AppError(400, `Payment status can't go from "${order.paymentStatus}" to "${data.paymentStatus}"`);
    }
  }
};
const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  assertAdminOrderChange(order, data);

  const wasStatus = order.status;

  if (data.status) order.status = data.status;
  if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
  await order.save();

  // STOCK BACK, SELLER MONEY DROPPED, BUYER REFUNDED
  if (wasStatus !== "cancelled" && order.status === "cancelled") {
    await revertOrder(order);
  }

  return order;
};

/* PART OF AN ORDER CAN BE CANCELLED ONLY WHEN IT'S PAID (OR CASH) AND STILL OPEN*/
const assertPartCancellable = (order) => {
  if (!["processing", "shipped"].includes(order.status)) {
    throw new AppError(400, `Part of a ${order.status} order can't be cancelled — cancel the whole order instead`);
  }
};

// ADMIN CANCEL ONE STORE'S PART (GROUP = STORE ID OR "site")
const adminCancelGroup = async (orderId, group) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  assertPartCancellable(order);

  const items = groupItems(order, group);
  if (!items.length) throw new AppError(404, "This part of the order doesn't exist or is already cancelled");

  const refund = await cancelItems(order, items, "cancelled by admin");

  const id = String(order._id).slice(-6).toUpperCase();
  await notifyUser(
    order.user,
    `Part of your order #${id} was cancelled` + (refund > 0 ? ` and ${refund} was refunded to your wallet.` : "."),
    { type: "order_status", link: `/dashboard/orders/${order._id}` }
  );

  // TELL THE SELLER
  if (group !== "site") {
    const store = await Store.findById(group).select("owner").lean();
    if (store?.owner) {
      await notifyUser(
        store.owner,
        `The admin cancelled your part of order #${id}.`,
        { type: "order_status", link: "/dashboard/seller/orders" }
      );
    }
  }
  return order;
};

// ADMIN CANCEL ONE ITEM, THE REST OF THE ORDER GOES ON
const adminCancelItem = async (orderId, itemId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  assertPartCancellable(order);

  const item = order.items.id(itemId);
  if (!item || item.cancelledAt) throw new AppError(404, "Item not found or already cancelled");

  const refund = await cancelItems(order, [item], "cancelled by admin");

  const id = String(order._id).slice(-6).toUpperCase();
  const title = item.productSnapshot.title;
  await notifyUser(
    order.user,
    `"${title}" in your order #${id} was cancelled` + (refund > 0 ? ` and ${refund} was refunded to your wallet.` : "."),
    { type: "order_status", link: `/dashboard/orders/${order._id}` }
  );

  // TELL THE SELLER
  if (item.store) {
    const store = await Store.findById(item.store).select("owner").lean();
    if (store?.owner) {
      await notifyUser(
        store.owner,
        `The admin cancelled "${title}" in order #${id}.`,
        { type: "order_status", link: "/dashboard/seller/orders" }
      );
    }
  }
  return order;
};




// RUNS ALL ORDER CHECKS NOW (THEY ALSO RUN EVERY 10 MINUTES BY THEMSELVES)
const runAutoComplete = async () => {
  const { runOrderSweeps } = require("../shared/orderSweeper");
  return runOrderSweeps();
};


// CASH FOR SITE ITEMS: ADMIN CONFIRMS IT (STORE ITEMS ARE CONFIRMED BY THE STORE)
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

// SITE DIDN'T RECEIVE THE CASH FOR ONE OF ITS ITEMS
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
  adminSetDeliveryEstimate,
  adminConfirmCash,
  adminReportCashMissing,
  adminCancelGroup,
  adminCancelItem,
  runAutoComplete,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  adminShipItem,
};