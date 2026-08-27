const Offer = require("../models/offerSeller");
const Coupon = require("../models/coupon");
const Cart = require("../models/cart");
const Listing = require("../models/listing");
const paginate = require("../utils/helper");

// ─── helpers 

const itemKey = (item) => {
  const offerId = item.offer || item.offerId || "";
  return `${String(offerId)}::${String(item.product || "")}::${String(item.variantId || "")}`;
};

const calculateCartTotals = async (items, couponDoc = null, shippingCost = 0) => {
  const normalizedItems = [];
  let subtotal = 0;
  const skippedItems = []; // track why items were dropped, instead of silently losing them

  const offerItems = items.filter((item) => item.offer || item.offerId);
  const directItems = items.filter((item) => !(item.offer || item.offerId));

  // ── 1) OFFER-BASED ITEMS (bought through a seller's accepted offer) ──
  const offerIds = [...new Set(offerItems.map((item) => item.offer || item.offerId).filter(Boolean))];

  const offers = await Offer.find({
    _id: { $in: offerIds },
  }).populate("product", "_id title images");

  const offerMap = new Map(offers.map((o) => [String(o._id), o]));

  for (const item of offerItems) {
    const offerId = item.offer || item.offerId;
    const offer = offerMap.get(String(offerId));

    if (!offer) {
      skippedItems.push({ offerId, reason: "offer_not_found" });
      continue;
    }
    if (offer.status !== "accepted") {
      skippedItems.push({ offerId, reason: "offer_not_accepted", status: offer.status });
      continue;
    }
    if (!(offer.stock > 0)) {
      skippedItems.push({ offerId, reason: "offer_out_of_stock", stock: offer.stock });
      continue;
    }
    if (offer.stock < item.quantity) {
      skippedItems.push({ offerId, reason: "insufficient_stock", stock: offer.stock, requested: item.quantity });
      continue;
    }
    if (!item.variantId) {
      skippedItems.push({ offerId, reason: "missing_variant_id" });
      continue;
    }
    if (!offer.product) {
      skippedItems.push({ offerId, reason: "offer_missing_product_ref" });
      continue;
    }

    const price = offer.finalPrice;
    subtotal += price * item.quantity;

    normalizedItems.push({
      offer: offer._id,
      product: offer.product._id,
      variantId: item.variantId,
      quantity: item.quantity,
      priceSnapshot: price,
    });
  }

  // ── 2) DIRECT ITEMS (no seller offer exists yet — buy at the listing's own price) ──
  const directProductIds = [...new Set(directItems.map((item) => item.product).filter(Boolean))];
  const listings = directProductIds.length
    ? await Listing.find({ _id: { $in: directProductIds } })
    : [];
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));

  for (const item of directItems) {
    if (!item.product) {
      skippedItems.push({ reason: "missing_product_id" });
      continue;
    }

    const listing = listingMap.get(String(item.product));
    if (!listing) {
      skippedItems.push({ productId: item.product, reason: "product_not_found" });
      continue;
    }
    if (!["active", "accepted"].includes(listing.status)) {
      skippedItems.push({ productId: item.product, reason: "product_not_available", status: listing.status });
      continue;
    }

    let price = listing.price;

    if (listing.variants && listing.variants.length > 0) {
      if (!item.variantId) {
        skippedItems.push({ productId: item.product, reason: "missing_variant_id" });
        continue;
      }

      const variant = typeof listing.variants.id === "function"
        ? listing.variants.id(item.variantId)
        : listing.variants.find((v) => String(v._id) === String(item.variantId));

      if (!variant) {
        skippedItems.push({ productId: item.product, reason: "variant_not_found" });
        continue;
      }
      if (!(variant.stock > 0)) {
        skippedItems.push({ productId: item.product, reason: "variant_out_of_stock", stock: variant.stock });
        continue;
      }
      if (variant.stock < item.quantity) {
        skippedItems.push({ productId: item.product, reason: "insufficient_stock", stock: variant.stock, requested: item.quantity });
        continue;
      }

      price = variant.price ?? listing.price;
    }

    subtotal += price * item.quantity;

    normalizedItems.push({
      offer: null,
      product: listing._id,
      variantId: item.variantId,
      quantity: item.quantity,
      priceSnapshot: price,
    });
  }

  if (skippedItems.length > 0) {
    console.warn("[cart] skipped items while calculating totals:", skippedItems);
  }

  let discount = 0;
  if (couponDoc) {
    const now = new Date();
    const isValid =
      couponDoc.isActive &&
      (!couponDoc.startsAt || couponDoc.startsAt <= now) &&
      (!couponDoc.expiresAt || couponDoc.expiresAt >= now);

    if (isValid) {
      if (couponDoc.type === "percent") {
        discount = Math.floor((subtotal * Number(couponDoc.amount || 0)) / 100);
      } else if (couponDoc.type === "fixed") {
        discount = Number(couponDoc.amount || 0);
      }
      if (couponDoc.maxDiscount) {
        discount = Math.min(discount, Number(couponDoc.maxDiscount));
      }
    }
  }

  discount = Math.min(discount, subtotal);
  const finalTotal = subtotal - discount + Number(shippingCost || 0);

  return {
    items: normalizedItems,
    skippedItems,
    pricing: {
      subtotal,
      discount,
      shippingCost: Number(shippingCost || 0),
      total: finalTotal,
    },
  };
};

const mergeCartItems = (currentItems, newItems) => {
  const merged = [...currentItems];

  for (const newItem of newItems) {
    const existingIndex = merged.findIndex(
      (item) => itemKey(item) === itemKey(newItem)
    );

    if (existingIndex > -1) {
      merged[existingIndex].quantity += Number(newItem.quantity) || 1;
    } else {
      merged.push({
        offer: newItem.offer || newItem.offerId || null,
        product: newItem.product,
        variantId: newItem.variantId,
        quantity: Number(newItem.quantity) || 1,
        priceSnapshot: newItem.priceSnapshot || 0,
      });
    }
  }

  return merged;
};

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

  if (!cart) throw { status: 404, message: "Cart not found" };
  return cart;
};

const deleteCart = async (id) => {
  const cart = await Cart.findByIdAndDelete(id);
  if (!cart) throw { status: 404, message: "Cart not found" };
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
      throw {
        status: 400,
        message: "None of the requested items could be added to the cart.",
        details: totals.skippedItems,
      };
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
    throw {
      status: 400,
      message: "Some items could not be added to the cart.",
      details: totals.skippedItems,
    };
  }

  cart.items = totals.items;
  cart.pricing = totals.pricing;

  await cart.save();
  return cart;
};

/*Removes a single item from the cart.*/
const removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ user: userId, status: "active" });
  if (!cart) throw { status: 404, message: "Cart not found" };

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
    throw { status: 404, message: "Cart item not found" };
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
  if (!cart) throw { status: 404, message: "Cart not found" };

  const items = data.items || cart.items;

  let couponDoc = null;
  if (data.couponCode) {
    couponDoc = await Coupon.findOne({ code: data.couponCode.toUpperCase() });
    if (!couponDoc) throw { status: 400, message: "NOT FOUND" };
  } else if (cart.coupon?.couponRef) {
    couponDoc = await Coupon.findById(cart.coupon.couponRef);
  }

  const totals = await calculateCartTotals(
    items,
    couponDoc,
    data.shippingCost ?? cart.pricing?.shippingCost ?? 0
  );

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
  if (!cart) throw { status: 404, message: "Cart not found" };

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