const Cart = require("../../models/cart");
const Order = require("../../models/order");
const { paginate, calculateCartTotals, getCouponProblem } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { createPayment } = require("../shared/zarinpal");
const { buildOrderIdSearchExpr, finalizeOrder } = require("../shared/order");

const DAY_MS = 24 * 60 * 60 * 1000;

/* ═══════════════════════════ CHECKOUT: Cart → Order ═══════════════════════════ */

const checkout = async (userId, shippingAddress, paymentMethod) => {

  const cart = await Cart.findOneAndUpdate(
    { user: userId, status: "active", "items.0": { $exists: true } },
    { $set: { status: "converted" } },
    { new: true }
  ).populate("coupon");

  if (!cart) {
    throw new AppError(400, "Cart is empty or is already being checked out");
  }

  const unlockCart = () =>
    Cart.updateOne({ _id: cart._id }, { $set: { status: "active" } }).catch((err) =>
      logger.error(`[checkout] could not unlock cart ${cart._id}:`, err)
    );

  try {
    const coupon = cart.coupon && !getCouponProblem(cart.coupon) ? cart.coupon : null;
    const totals = await calculateCartTotals(cart.items, coupon, cart.shippingCost || 0);

    if (totals.skippedItems.length > 0) {
      throw new AppError(409, "Some items are no longer available", {
        details: totals.skippedItems,
      });
    }

    const orderItems = totals.items.map((item) => ({
      product: item.product,
      variantId: item.variantId || null,
      offer: item.offer || null,
      store: item.store || null,

      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      finalPrice: item.finalPrice,

      productSnapshot: {
        title: item.productInfo.title,
        image: item.productInfo.images[0] || null,
        slug: item.productInfo.slug,
      },
      variantSnapshot: item.variantSnapshot || { attributes: null, sku: null },
      storeSnapshot: { name: item.offerInfo?.store?.name || null },

      fulfillment: { status: "pending", trackingCode: null, shippedAt: null },
      estimatedShipBy: new Date(Date.now() + (item.shipsWithinDays ?? 3) * DAY_MS),
      needsAdminShipment: !item.store && item.listingType === "store_product",
    }));

    const order = await Order.create({
      user: cart.user,
      items: orderItems,
      coupon: coupon
        ? {
          couponId: coupon._id,
          code: coupon.code,
          type: coupon.type,
          amount: coupon.amount,
          maxDiscount: coupon.maxDiscount ?? null,
        }
        : null,
      pricing: totals.pricing,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      status: "created",
    });

    // 5) Payment
    let paymentUrl = null;
    if (paymentMethod === "zarinpal") {
      const payment = await createPayment(order.pricing.total * 10, `Order ${order._id}`);

      if (!payment?.data?.authority) {
        order.status = "cancelled";
        order.paymentStatus = "failed";
        await order.save();
        throw new AppError(502, "Payment init failed");
      }

      order.payment = { authority: payment.data.authority };
      paymentUrl = `https://www.zarinpal.com/pg/StartPay/${payment.data.authority}`;
      await order.save();
    }

    if (paymentMethod === "cash") {
      await finalizeOrder(order);
      await order.save();
    }

    return { order, paymentUrl };
  } catch (err) {
    await unlockCart();
    throw err;
  }
};

const getMyOrders = async (userId, query = {}) => {
  const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  const filters = { user: userId };
  if (query.status && query.status !== "all") filters.status = query.status;

  const searchExpr = buildOrderIdSearchExpr(query.q);
  if (searchExpr) filters.$expr = searchExpr;

  return paginate(Order, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { _id: -1 }
  });
};


const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");
  return order;
};

const OWNER_UPDATABLE_FIELDS = ["shippingAddress"];

const updateOrderByOwner = async (orderId, userId, data) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

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

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

  if (["shipped", "completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, "Order cannot be cancelled");
  }

  order.status = "cancelled";
  return order.save();
};

const confirmDelivery = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

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
  getMyOrders,
  getOrderById,
  updateOrderByOwner,
  cancelOrder,
  confirmDelivery,
};