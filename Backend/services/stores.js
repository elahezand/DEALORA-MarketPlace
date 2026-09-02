const Store = require("../models/store");
const UserModel = require("../models/user");
const Listing = require("../models/listing");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

/*  PUBLIC  */
const getVerifiedStores = async ({ limit, cursor } = {}) => {
  return paginate(Store, {
    limit: limit || 12,
    cursor,
    filters: { isVerified: true },
    sort: { createdAt: -1 },
    select: "name slug logo address.city meta.ratings meta.reviewsCount",
  });
};

const getStoreBySlug = async (slug, { cursor, limit } = {}) => {
  const store = await Store.findOne({ slug, isVerified: true })
    .select("name slug logo address meta isVerified")
    .lean();

  if (!store) throw new AppError(404, "Store not found");

  const { data, pagination } = await paginate(Listing, {
    limit: limit || 12,
    cursor,
    filters: {
      store: store._id,
      listingType: "store_product",
      status: "active",
    },
    sort: { createdAt: -1 },
    select: "title slug price images condition shortIdentifier createdAt",
  });

  return { store, data, pagination };
};

/*  ADMIN  */
const getAllStores = async ({ limit, cursor }) => {
  if (limit && Number(limit) > 50) {
    throw new AppError(400, "limit must be <= 50");
  }

  return paginate(Store, {
    limit,
    cursor,
    populate: "owner",
  });
};

/*  SELLER  */
const getStoresByOwner = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const shopsSeller = await Store.find({ owner: userId });
  return shopsSeller;
};

const createStore = async (userId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  // Owner must always be the authenticated user, never trust the client body.
  const newSeller = await Store.create({ ...data, owner: userId });

  try {
    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { role: "SELLER" } },
      { new: true }
    );
  } catch (err) {
    await Store.findByIdAndDelete(newSeller._id).catch(() => {});
    throw err;
  }

  return newSeller;
};

// Fields a seller is never allowed to set themselves via the update endpoint.
const SELLER_RESTRICTED_FIELDS = ["owner", "isVerified", "meta"];

const updateStore = async (userId, storeId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const existing = await Store.findById(storeId).lean();
  if (!existing) throw new AppError(404, "NOT found");

  if (String(existing.owner) !== String(userId)) {
    throw new AppError(403, "You do not have permission to update this store");
  }

  const safeData = { ...data };
  for (const field of SELLER_RESTRICTED_FIELDS) {
    delete safeData[field];
  }

  const merged = { ...existing, ...safeData };
  await Store.updateOne({ _id: storeId }, { $set: merged }).exec();
  return true;
};

const verifyStore = async (storeId, isVerified) => {
  const store = await Store.findByIdAndUpdate(
    storeId,
    { $set: { isVerified } },
    { new: true }
  ).populate("owner");

  if (!store) throw new AppError(404, "Store not found");

  return store;
};

const deleteStore = async (userId, storeId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const existing = await Store.findById(storeId);
  if (!existing) throw new AppError(404, "Seller not found");

  if (String(existing.owner) !== String(userId)) {
    throw new AppError(403, "You do not have permission to delete this store");
  }

  await Store.findByIdAndDelete(storeId);

  //!delete Products
  //!delete Products from shoping Card

  return true;
};

module.exports = {
  getVerifiedStores,
  getStoreBySlug,
  getAllStores,
  getStoresByOwner,
  createStore,
  updateStore,
  verifyStore,
  deleteStore,
};