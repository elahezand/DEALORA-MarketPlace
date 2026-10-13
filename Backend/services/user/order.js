const Cart = require("../../models/cart");
const Order = require("../../models/order");
const User = require("../../models/user");
const Store = require("../../models/store");
const notifyUser = require("../../utils/notify");
const { spendFromWallet } = require("../shared/wallet");
const { paginate, calculateCartTotals, getCouponProblem } = require("../../utils/helper");
const { round2 } = require("../../utils/pricing");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { createPayment } = require("../shared/zarinpal");
const {
  buildOrderIdSearchExpr, finalizeOrder, revertOrder, reserveStock, completeItems,
  activeItems, groupItems, cancelItems, reserveCoupon
} = require("../shared/order");
const { buildListQuery, listLimit } = require("../../utils/listQuery");

const DAY_MS = 24 * 60 * 60 * 1000;

const unlockCart = (cartId) =>
  Cart.updateOne({ _id: cartId }, { $set: { status: "active" } }).catch((err) =>
    logger.error(`[checkout] could not unlock cart ${cartId}:`, err)
  );


// CHECKOUT: Cart → Order 

const START_PAY_URL = process.env.ZARINPAL_PAYMENT_BASE_URL || "https://payment.zarinpal.com/pg/StartPay/";
const payUrl = (authority) => `${START_PAY_URL.replace(/\/?$/, "/")}${authority}`;
const toRial = (toman) => Math.round(Number(toman || 0) * 10);

const checkout = async (userId, shippingAddress, paymentMethod, idempotencyKey = null, useWallet = false) => {
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

  let createdOrder = null;

  try {
    const coupon = cart.coupon && !getCouponProblem(cart.coupon) ? cart.coupon : null;
    const totals = await calculateCartTotals(cart.items, coupon, cart.shippingCost || 0);

    if (totals.skippedItems.length > 0) {
      throw new AppError(409, "Some items are no longer available", {
        details: totals.skippedItems,
      });
    }
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

    await reserveStock(order);
    await reserveCoupon(order);

    // CASH: BUYER PAYS THE STORE ON DELIVERY, ORDER GOES STRAIGHT TO PROCESSING
    if (paymentMethod === "cash") {
      order.finalizedAt = order.finalizedAt || new Date();
      await order.save();

      await finalizeOrder(order);
      await order.save();
    }


    // WALLET: READ BALANCE ONLY, CHARGED AFTER ORDER IS CREATED (NOT FOR CASH)
    const buyer = useWallet && paymentMethod !== "cash"
      ? await User.findById(userId).select("wallet").lean()
      : null;
    const walletPlanned = buyer ? Math.min(buyer.wallet?.balance || 0, totals.pricing.total) : 0;

    // 5) Payment — the order exists now, so money can be moved safely
    let paymentUrl = null;

    if (walletPlanned > 0) {
      const charged = await spendFromWallet(
        userId,
        order._id,
        walletPlanned
      );

      if (charged > 0) {
        order.pricing.walletUsed = charged;
        order.pricing.total = round2(order.pricing.total - charged);
        await order.save();
      }
    }

    // NOTHING LEFT TO PAY (WALLET COVERED IT, OR THE COUPON DID) → PAID NOW
    if (order.pricing.total === 0 && paymentMethod !== "cash") {
      if (order.pricing.walletUsed > 0) order.paymentMethod = "wallet";
      order.paymentStatus = "paid";
      order.payment = {
        authority: null,
        refId: null,
        paidAt: new Date(),
      };
      order.finalizedAt = new Date();

      await order.save();
      await finalizeOrder(order);
      await order.save();

      return { order, paymentUrl: null };
    }

    // ZARINPAL: SOMETHING IS STILL LEFT TO PAY (WALLET PAID PART, OR WASN'T USED)
    if ((paymentMethod === "wallet" || paymentMethod === "zarinpal") && order.pricing.total > 0) {
      const payment = await createPayment(
        toRial(order.pricing.total),
        `Order ${order._id}`,
        shippingAddress?.phone || undefined
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

    return { order, paymentUrl };
  }
  catch (err) {
    await unlockCart(cart._id);

    if (createdOrder) {
      createdOrder.status = "cancelled";
      await createdOrder.save().catch(() => { });
      await revertOrder(createdOrder).catch((e) =>
        logger.error(`[checkout] could not revert order ${createdOrder._id}:`, e)
      );
    }
    throw err;
  }
};

const getMyOrders = async (userId, query = {}) => {
  const limit = listLimit(query, 20, 50);

  const filters = buildListQuery(query, {
    base: { user: userId },
    statuses: ["created", "processing", "shipped", "completed", "cancelled"],
  });

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

const updateOrderByOwner = async (orderId, userId, data) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

  if (["shipped", "completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, "Order can no longer be modified");
  }
  // ONE STORE ALREADY SHIPPED → THAT PARCEL LEFT WITH THE OLD ADDRESS
  if (order.items.some((item) => item.fulfillment?.status === "shipped")) {
    throw new AppError(400, "Part of this order has already been shipped — the address can't change");
  }

  if (data.shippingAddress !== undefined) {
    order.shippingAddress = { ...order.shippingAddress?.toObject?.(), ...data.shippingAddress };
  }
  return order.save();
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

  if (["shipped", "completed", "cancelled"].includes(order.status)) {
    throw new AppError(400, "Order cannot be cancelled");
  }
  // ONE PARCEL ALREADY SHIPPED → BUYER CAN'T CANCEL, SUPPORT / ADMIN DECIDES
  if (order.items?.some((item) => item.fulfillment?.status === "shipped")) {
    throw new AppError(400, "Part of this order has already been shipped — contact support to cancel it");
  }

  order.status = "cancelled";
  await order.save();

  // GIVE BACK STOCK, MONEY AND COUPON
  await revertOrder(order);
  return order;
};


// BUYER CONFIRMS RECEIPT: ONE STORE'S PARCEL, OR EVERYTHING SHIPPED
const confirmDelivery = async (orderId, userId, group = null) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

  if (!["processing", "shipped"].includes(order.status)) {
    throw new AppError(409, `This order can't be confirmed (it is "${order.status}")`);
  }

  const items = (group ? groupItems(order, group) : activeItems(order)).filter(
    (item) => !item.deliveredAt && item.fulfillment?.status === "shipped"
  );
  if (!items.length) throw new AppError(409, "Nothing shipped is waiting for your confirmation");

  if (items.every((item) => item.buyerConfirmedAt)) {
    throw new AppError(409, "You already confirmed receipt of these items");
  }

  const now = new Date();
  for (const item of items) item.buyerConfirmedAt = item.buyerConfirmedAt || now;

  if (activeItems(order).every((item) => item.buyerConfirmedAt)) order.buyerConfirmedAt = now;
  order.markModified("items");
  await order.save();

  // CASH: COMPLETE ONLY IF THE STORE CONFIRMED THE CASH
  const ready = order.paymentMethod === "cash" ? items.filter((item) => item.cashCollectedAt) : items;
  if (ready.length) await completeItems(order, ready);

  return order;
};

/* buyer drops one item that hasn't been shipped yet — the rest of the order goes on */
const cancelMyItem = async (orderId, userId, itemId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError(404, "Order not found");

  // unpaid online order: the gateway amount is fixed, cancel the whole order instead
  if (order.status !== "processing") {
    throw new AppError(400, "Items of this order can't be cancelled one by one");
  }

  const item = order.items.id(itemId);
  if (!item || item.cancelledAt) throw new AppError(404, "Item not found or already cancelled");
  if (item.fulfillment?.status === "shipped") {
    throw new AppError(400, "This item has already been shipped — contact support to cancel it");
  }

  const refund = await cancelItems(order, [item], "cancelled by buyer");

  // let the store know so it doesn't ship it
  if (item.store) {
    const store = await Store.findById(item.store).select("owner").lean();
    if (store?.owner) {
      const id = String(order._id).slice(-6).toUpperCase();
      await notifyUser(
        store.owner,
        `The buyer cancelled "${item.productSnapshot.title}" in order #${id} — don't ship it.`,
        { type: "order_status", link: "/dashboard/seller/orders" }
      ).catch((err) => logger.error(`[order ${order._id}] cancel notice failed:`, err));
    }
  }

  return { order, refund };
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderByOwner,
  cancelOrder,
  confirmDelivery,
  cancelMyItem,
};