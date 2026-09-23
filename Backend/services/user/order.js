const Cart = require("../../models/cart");
const Order = require("../../models/order");
const User = require("../../models/user");
const { spendFromWallet, refundToWallet } = require("../shared/wallet");
const { paginate, calculateCartTotals, getCouponProblem } = require("../../utils/helper");
const { round2 } = require("../../utils/pricing");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { createPayment } = require("../shared/zarinpal");
const { buildOrderIdSearchExpr, finalizeOrder, releaseOrderFunds, revertOrder } = require("../shared/order");

const DAY_MS = 24 * 60 * 60 * 1000;

/* ═══════════════════════════ CHECKOUT: Cart → Order ═══════════════════════════ */

const payUrl = (authority) => `https://www.zarinpal.com/pg/StartPay/${authority}`;

const checkout = async (userId, shippingAddress, paymentMethod, idempotencyKey = null, useWallet = false) => {
  // the client retried (lost response, double click, refresh) → give back the same order
  if (idempotencyKey) {
    const existing = await Order.findOne({ user: userId, idempotencyKey });
    if (existing) {
      return {
        order: existing,
        paymentUrl: existing.payment?.authority ? payUrl(existing.payment.authority) : null,
      };
    }
  }

  const cart = await Cart.findOneAndUpdate(
    { user: userId, status: "active", "items.0": { $exists: true } },
    { $set: { status: "converted" } },
    { returnDocument: "after" }
  ).populate("coupon");

  if (!cart) {
    throw new AppError(400, "Cart is empty or is already being checked out");
  }

  let walletSpent = 0;
  let createdOrder = null;

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

    // how much of this order the wallet could cover (charged after the order exists)
    const buyer = useWallet ? await User.findById(userId).select("wallet").lean() : null;
    const walletPlanned = buyer ? Math.min(buyer.wallet?.balance || 0, totals.pricing.total) : 0;
    const pricing = { ...totals.pricing, walletUsed: 0 };

    const orderItems = totals.items.map((item) => ({
      productId: item.productId,
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

    const order = createdOrder = await Order.create({
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
      pricing,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      status: "created",
      idempotencyKey,
    });
    // 5) Payment — the order exists now, so money can be moved safely
    let paymentUrl = null;

    if (walletPlanned > 0) {
      order.finalizedAt = new Date();
      await order.save();

      const charged = await spendFromWallet(
        userId,
        order._id,
        walletPlanned
      );

      if (charged > 0) {
        walletSpent = charged;
        order.pricing.walletUsed = charged;
        order.pricing.total = round2(order.pricing.total - charged);
        await order.save();
      }
    }

    // Wallet covered the whole order
    if (order.pricing.total === 0 && order.pricing.walletUsed > 0) {
      order.paymentMethod = "wallet";
      order.paymentStatus = "paid";
      order.payment = {
        authority: null,
        refId: null,
        paidAt: new Date(),
      };

      await order.save();
      await finalizeOrder(order);
      await order.save();

      return { order, paymentUrl: null };
    }

    // Wallet covered only part of the order
    // or the user selected ZarinPal directly
    if (
      (paymentMethod === "wallet" || paymentMethod === "zarinpal") &&
      order.pricing.total > 0
    ) {
      const payment = await createPayment(
        order.pricing.total * 10,
        `Order ${order._id}`
      );

      if (!payment?.data?.authority) {
        order.status = "cancelled";
        order.paymentStatus = "failed";
        await order.save();

        throw new AppError(502, "Payment init failed");
      }

      // Remaining amount will be paid through ZarinPal
      order.paymentMethod = "zarinpal";
      order.payment = {
        authority: payment.data.authority,
      };

      paymentUrl = payUrl(payment.data.authority);
      await order.save();
    }

    if (paymentMethod === "cash") {
      order.finalizedAt = order.finalizedAt || new Date();
      await order.save();

      await finalizeOrder(order);
      await order.save();
    }

    return { order, paymentUrl };
  } catch (err) {
    await unlockCart();
    if (walletSpent > 0 && createdOrder) {
      await refundToWallet(userId, createdOrder._id, walletSpent, "checkout failed");
    }
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
  await order.save();

  // give back the stock, the held money and the coupon use
  await revertOrder(order);
  return order;
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
  await order.save();

  // delivered → the sellers can now withdraw their money
  await releaseOrderFunds(order);
  return order;
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderByOwner,
  cancelOrder,
  confirmDelivery,
};