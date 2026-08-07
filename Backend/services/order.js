const { Types } = require("mongoose");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Listing = require("../models/listing");
const paginate = require("../utils/helper");
const {
  createPayment,
  verifyPayment,
} = require("../services/zarinpal");

/* Checkout: Cart → Order */
const checkout = async (userId, shippingAddress, paymentMethod) => {
  const cart = await Cart.findOne({
    user: userId,
    status: "active",
  }).populate("items.product items.offer");

  if (!cart || cart.items.length === 0) {
    throw { status: 400, message: "Cart is empty" };
  }

  // Transform cart items to order items (map variantId → variant, priceSnapshot → price)
  const orderItems = cart.items.map((item) => ({
    product: item.product,
    variant: item.variantId,
    quantity: item.quantity,
    price: item.priceSnapshot || 0,
    seller: item.offer?.store || null,
  }));

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

  const payment = await createPayment(
    order.pricing.total * 10,
    `Order ${order._id}`
  );

  if (!payment?.data?.authority) {
    throw { status: 500, message: "Payment init failed" };
  }

  order.payment = {
    authority: payment.data.authority,
  };

  await order.save();

  cart.status = "converted";
  await cart.save();

  return {
    order,
    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${payment.data.authority}`,
  };
};

const verify = async (authority) => {
  const order = await Order.findOne({
    "payment.authority": authority,
  });

  if (!order) {
    throw { status: 404, message: "Order not found" };
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

  await Promise.all(
    order.items.map(async (item) => {
      const result = await Listing.updateOne(
        { 
          _id: item.product,
          "variants._id": item.variantId,        
          "variants.stock": { $gte: item.quantity } 
        },
        {
          $inc: {
            "metrics.sold": item.quantity,
            "variants.$[elem].stock": -item.quantity
          }
        },
        {
          arrayFilters: [{ 
            "elem._id": new Types.ObjectId(item.variantId)
          }]
        }
      );
      if (result.modifiedCount === 0) {
        console.warn(`Stock update failed for variant ${item.variantId} - possibly out of stock`);
      }
    })
  );

  await order.save();
  return order;
};

/* User Orders */
const getMyOrders = async (userId, query = {}) => {
 const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  return paginate(Order, {
    limit,
    cursor: query.cursor,
    filters: {
      user: userId,
    },
    sort: { createdAt: -1 },
  });
};

/* User Single Order */
const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

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

  return paginate(Order, {
    limit: limit ? Number(limit) : 20,
    cursor,
    sort: { createdAt: -1 },
  });
};

/* Admin Single Order */
const getOrderByIdAdmin = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

  return order;
};

/* Update Order */
const updateOrder = async (orderId, data) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

  Object.assign(order, data);

  return order.save();
};

/* Cancel Order */
const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

  if (["shipped", "completed"].includes(order.status)) {
    throw {
      status: 400,
      message: "Order cannot be cancelled",
    };
  }

  order.status = "cancelled";

  return order.save();
};

module.exports = {
  checkout,
  verify,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrder,
  cancelOrder,
};