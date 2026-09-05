const Coupon = require("../models/coupon");
const Cart = require("../models/cart");
const { paginate } = require("../utils/helper");
const AppError = require("../utils/AppError");
const { mergeCartItems, calculateCartTotals,itemKey } = require("../utils/helper")

// ─── ADMIN ──────────────────────────────────────────────────────────────────

const getAdminCarts = async (query = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 100);
  return paginate(Cart, { ...query, limit }, {}, "user items.product");
};

const getCartById = async (id) => {
  const cart = await Cart.findById(id)
    .populate("user", "name email phone")
    .populate("items.product", "title images")
    .populate({
      path: "items.offer",
      select: "price discount stock store finalPrice",
    });

  if (!cart) throw new AppError(404, "Cart not found");
  return cart;
};

const deleteCart = async (id) => {
  const cart = await Cart.findByIdAndDelete(id);
  if (!cart) throw new AppError(404, "Cart not found");
  return true;
};

// ─── USER 

const getUserCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId, status: "active" })
    .populate("items.product", "title images")
    .populate({
      path: "items.offer",
      select: "price discount stock store finalPrice",
    });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      pricing: { subtotal: 0, discount: 0, shippingCost: 0, total: 0 },
      status: "active",
    });
  }
  return cart;
};

const addToCart = async (userId, items) => {
  let cart = await Cart.findOne({ user: userId, status: "active" });

  if (!cart) {
    const totals = await calculateCartTotals(items, null, 0);    
    if (totals.items.length === 0 && items.length > 0) {
      throw new AppError(400, "None of the requested items could be added to the cart.", {
        details: totals.skippedItems,
      });
    }
    return Cart.create({
      user: userId,
      items: totals.items,
      pricing: totals.pricing,
      status: "active",
    });
  }

  let couponDoc = null;
  if (cart.coupon?.couponRef) {
    couponDoc = await Coupon.findById(cart.coupon.couponRef);
  }

  const mergedItems = mergeCartItems(cart.items, items);
  const totals = await calculateCartTotals(
    mergedItems,
    couponDoc,
    cart.pricing?.shippingCost || 0
  );


  const resultKeys = new Set(totals.items.map((i) => itemKey(i)));
  const droppedRequested = items.filter((i) => !resultKeys.has(itemKey(i)));

  if (droppedRequested.length > 0) {
    throw new AppError(400, "Some items could not be added to the cart.", {
      details: totals.skippedItems,
    });
  }

  cart.items = totals.items;
  cart.pricing = totals.pricing;

  await cart.save();
  console.log(cart);
  
  return cart;
};

/*Removes a single item from the cart.*/
const removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ user: userId, status: "active" });
  if (!cart) throw new AppError(404, "Cart not found");

  const beforeCount = cart.items.length;
  cart.items = cart.items.filter((item) => {
    const matchesOffer = item.offer && String(item.offer) === String(itemId);
    const matchesDirectVariant =
      !item.offer && item.variantId && String(item.variantId) === String(itemId);
    const matchesDirectProduct =
      !item.offer && !item.variantId && String(item.product) === String(itemId);
    return !(matchesOffer || matchesDirectVariant || matchesDirectProduct);
  });

  if (cart.items.length === beforeCount) {
    throw new AppError(404, "Cart item not found");
  }

  let couponDoc = null;
  if (cart.coupon?.couponRef) {
    couponDoc = await Coupon.findById(cart.coupon.couponRef);
  }

  const totals = await calculateCartTotals(
    cart.items,
    couponDoc,
    cart.pricing?.shippingCost || 0
  );

  cart.items = totals.items;
  cart.pricing = totals.pricing;

  await cart.save();
  return cart;
};

const updateCart = async (userId, data) => {
  const cart = await Cart.findOne({ user: userId, status: "active" });
  if (!cart) throw new AppError(404, "Cart not found");

  const items = data.items || cart.items;

  let couponDoc = null;
  if (data.couponCode) {
    couponDoc = await Coupon.findOne({ code: data.couponCode.toUpperCase() });
    if (!couponDoc) {
      throw new AppError(404, "Coupon not found");
    }

    const now = new Date();
    if (!couponDoc.isActive) {
      throw new AppError(400, "Coupon is inactive");
    }
    if (couponDoc.startsAt && couponDoc.startsAt > now) {
      throw new AppError(400, "Coupon has not started yet");
    }
    if (couponDoc.expiresAt && couponDoc.expiresAt < now) {
      throw new AppError(400, "Coupon has expired");
    }
    if (couponDoc.usageLimit !== null && couponDoc.usedCount >= couponDoc.usageLimit) {
      throw new AppError(400, "Coupon usage limit reached");
    }
  } else if (cart.coupon?.couponRef) {
    couponDoc = await Coupon.findById(cart.coupon.couponRef);
  }

  const totals = await calculateCartTotals(
    items,
    couponDoc,
    data.shippingCost ?? cart.pricing?.shippingCost ?? 0
  );

  if (totals.skippedItems.length > 0) {
    throw new AppError(400, "Some items in your cart are no longer available and could not be kept.", {
      details: totals.skippedItems,
    });
  }

  cart.items = totals.items;
  cart.pricing = totals.pricing;
  cart.coupon = couponDoc
    ? {
      couponRef: couponDoc._id,
      code: couponDoc.code,
      discountType: couponDoc.type,
      discountValue: couponDoc.amount,
      maxDiscount: couponDoc.maxDiscount,
    }
    : null;

  await cart.save();
  return cart;
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId, status: "active" });
  if (!cart) throw new AppError(404, "Cart not found");

  cart.items = [];
  cart.pricing = { subtotal: 0, discount: 0, shippingCost: 0, total: 0 };
  cart.coupon = null;

  await cart.save();
  return true;
};

module.exports = {
  getAdminCarts,
  getCartById,
  deleteCart,
  getUserCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearCart,
};