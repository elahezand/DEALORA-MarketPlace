const Coupon = require("../../models/coupon");
const Cart = require("../../models/cart");
const AppError = require("../../utils/AppError");
const { mergeCartItems, calculateCartTotals, itemKey } = require("../../utils/helper");
const { toStoredItem, getCouponProblem, buildCartView } = require("../shared/cart");

const findUsableCoupon = async (code) => {
  const couponDoc = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  const problem = getCouponProblem(couponDoc);
  if (problem) throw new AppError(couponDoc ? 400 : 404, problem);
  return couponDoc;
};

const getOrCreateActiveCart = async (userId) => {
  try {
    return await Cart.findOneAndUpdate(
      { user: userId, status: "active" },
      { $setOnInsert: { user: userId, items: [], status: "active" } },
      { new: true, upsert: true }
    );
  } catch (err) {
    if (err?.code === 11000) return Cart.findOne({ user: userId, status: "active" });
    throw err;
  }
};


const getUserCart = async (userId) => {
  const cart = await getOrCreateActiveCart(userId);
  return buildCartView(cart);
};

const addToCart = async (userId, items) => {
  const cart = await getOrCreateActiveCart(userId);

  const mergedItems = mergeCartItems(cart.items.map((i) => i.toObject?.() ?? i), items);
  const totals = await calculateCartTotals(mergedItems, null, 0);

  const resultKeys = new Set(totals.items.map((i) => itemKey(i)));
  const droppedRequested = items.filter((i) => !resultKeys.has(itemKey(i)));
  if (droppedRequested.length > 0) {
    throw new AppError(400, "Some items could not be added to the cart.", {
      details: totals.skippedItems,
    });
  }

  cart.items = totals.items.map(toStoredItem);
  await cart.save();
  return buildCartView(cart, { prune: false });
};

const removeFromCart = async (userId, itemId) => {
  const cart = await getOrCreateActiveCart(userId);

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

  await cart.save();
  return buildCartView(cart);
};

const updateCart = async (userId, data) => {
  const cart = await getOrCreateActiveCart(userId);

  if (data.items) {
    const totals = await calculateCartTotals(data.items, null, 0);
    if (totals.skippedItems.length > 0) {
      throw new AppError(400, "Some items in your cart are no longer available and could not be kept.", {
        details: totals.skippedItems,
      });
    }
    cart.items = totals.items.map(toStoredItem);
  }

  if (data.removeCoupon) {
    cart.coupon = null;
  } else if (data.couponCode) {
    const couponDoc = await findUsableCoupon(data.couponCode);
    cart.coupon = couponDoc._id;
  }


  await cart.save();
  return buildCartView(cart, { prune: false });
};

const clearCart = async (userId) => {
  await Cart.updateOne(
    { user: userId, status: "active" },
    { $set: { items: [], coupon: null } }
  );
  return true;
};

module.exports = {
  getUserCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearCart,
};
