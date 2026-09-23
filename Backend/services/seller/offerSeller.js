/* offerSeller — SELLER — store owners */
const mongoose = require("mongoose");
const OfferSeller = require("../../models/offerSeller");
const Store = require("../../models/store");
const Listing = require("../../models/listing");
const { paginate, escapeRegex } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { assertOfferableVariant, assertValidStatus } = require("../shared/offerSeller");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const PRODUCT_FIELDS = "_id title slug images variants listingType status";

const getMyStoreId = async (userId) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  return store?._id || null;
};

const getMyStore = (userId) => Store.findOne({ owner: userId }).select("_id category").lean();

// a store can only offer on products under its own category
const isInStoreCategory = (product, store) =>
  !!store.category && (product.categoryPath || []).some((id) => String(id) === String(store.category));

// === PRODUCTS THE SELLER CAN OFFER ON (active, in the store's category) ===
const getOfferableProducts = async (userId, query = {}) => {
  const store = await getMyStore(userId);
  if (!store) throw new AppError(404, "Store not found");

  const empty = { data: [], pagination: { limit: 20, nextCursor: null, hasMore: false } };
  if (!store.category) return { ...empty, needsCategory: true };

  const filters = {
    listingType: "store_product",
    status: "active",
    categoryPath: store.category,
  };
  if (query.q && String(query.q).trim()) {
    filters.title = { $regex: new RegExp(escapeRegex(String(query.q).trim()), "i") };
  }

  const result = await paginate(Listing, {
    limit: Math.min(Number(query.limit) || 20, 50),
    cursor: query.cursor,
    filters,
    select: "_id title slug images variants minPrice categoryPath listingType status createdAt",
    sort: { _id: -1 }

  });
  return { ...result, needsCategory: false };
};

// === CREATE OFFER (SELLER) ===
const createOffer = async (userId, data) => {
  const { productId, variantId, price, stock, discount, shipsWithinDays, description } = data;

  if (!isValidId(productId)) throw new AppError(400, "Invalid product id");
  if (!isValidId(variantId)) throw new AppError(400, "Invalid variantId");

  const store = await getMyStore(userId);
  if (!store) throw new AppError(404, "Store not found");
  if (!store.category) throw new AppError(400, "Set your store category before making offers");
  const storeId = store._id;

  const product = await Listing.findById(productId).select("listingType status variants categoryPath").lean();
  assertOfferableVariant(product, variantId);
  if (!isInStoreCategory(product, store)) {
    throw new AppError(403, "This product is not in your store's category");
  }

  const existingOffer = await OfferSeller.exists({
    productId,
    variantId,
    store: storeId,
    status: { $in: ["pending", "accepted"] },
  });
  if (existingOffer) {
    throw new AppError(409, "You already have an active or pending offer for this variant");
  }

  return OfferSeller.create({
    productId,
    variantId,
    store: storeId,
    price,
    stock,
    discount: discount ?? 0,
    shipsWithinDays,
    description,
    status: "pending",
  });
};

// === UPDATE OFFER (SELLER, own pending/accepted offer) ===
const updateOffer = async (userId, offerId, data) => {
  const { price, stock, discount, shipsWithinDays, description } = data;

  if (!isValidId(offerId)) throw new AppError(400, "Invalid offerId");

  const storeId = await getMyStoreId(userId);
  if (!storeId) throw new AppError(404, "Store not found");

  const offer = await OfferSeller.findOne({
    _id: offerId,
    store: storeId,
    status: { $in: ["pending", "accepted"] },
  });
  if (!offer) throw new AppError(404, "Active offer not found");

  if (price !== undefined) offer.price = price;
  if (stock !== undefined) offer.stock = stock;
  if (discount !== undefined) offer.discount = discount;
  if (shipsWithinDays !== undefined) offer.shipsWithinDays = shipsWithinDays;
  if (description !== undefined) offer.description = description;

  // save() (not updateOne) → finalPrice is recalculated and the product's minPrice is synced
  await offer.save();
  return offer;
};

// === GET MY OFFERS (SELLER) ===
const getMine = async (userId, query = {}) => {
  const storeId = await getMyStoreId(userId);
  if (!storeId) {
    return { data: [], pagination: { limit: Number(query.limit) || 21, nextCursor: null, hasMore: false } };
  }
  assertValidStatus(query.status);

  const filters = { store: storeId };
  if (query.status) filters.status = query.status;
  if (!query.status || query.status === "all") {
    filters.status = { $ne: "deleted" };
  }


  if (query.q && String(query.q).trim()) {
    const regex = new RegExp(escapeRegex(String(query.q).trim()), "i");
    const matchingProducts = await Listing.find({ listingType: "store_product", title: regex })
      .select("_id")
      .lean();
    filters.productId = { $in: matchingProducts.map((p) => p._id) };
  }

  return paginate(OfferSeller, {
    limit: query.limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "productId", select: PRODUCT_FIELDS },
      { path: "store", select: "name slug" },
    ],
  });
};

// === DELETE OFFER (SELLER: own pending offer — ADMIN: any) ===
const remove = async (offerId, user) => {
  if (!isValidId(offerId)) throw new AppError(400, "Invalid offerId");

  const offer = await OfferSeller.findById(offerId);
  if (!offer) throw new AppError(404, "Offer not found");

  const myStoreId = await getMyStoreId(user._id);
  if (!myStoreId || String(offer.store) !== String(myStoreId)) {
    throw new AppError(403, "Forbidden");
  }
  if (offer.status !== "pending") {
    throw new AppError(409, "Only pending offers can be deleted by the seller");
  }
  await OfferSeller.findByIdAndDelete(offerId);
  return true;
};

module.exports = {
  getOfferableProducts,
  createOffer,
  updateOffer,
  getMine,
  remove,
};
