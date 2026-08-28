const Store = require("../models/store");
const UserModel = require("../models/user");
const paginate = require("../utils/helper");

/*  PUBLIC  */
const getVerifiedStores = async ({ limit } = {}) => {
  return Store.find({ isVerified: true })
    .select("name slug logo address.city meta.ratings meta.reviewsCount")
    .sort({ "meta.ratings": -1, createdAt: -1 })
    .limit(Math.min(Number(limit) || 12, 24))
    .lean();
};

/*  ADMIN  */
const getAllStores = async ({ limit, cursor }) => {
  if (limit && Number(limit) > 50) {
    throw { status: 400, message: "limit must be <= 50" };
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
  if (!user) throw { status: 404, message: "NOT found" };

  const shopsSeller = await Store.find({ user: userId });
  if (!shopsSeller) throw { status: 404, message: "NOT found" };

  return shopsSeller;
};

const createStore = async (userId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw { status: 404, message: "NOT found" };

  const newSeller = await Store.create(data);

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

const updateStore = async (userId, storeId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw { status: 404, message: "NOT found" };

  const existing = await Store.findById(storeId).lean();
  if (!existing) throw { status: 404, message: "NOT found" };

  const merged = { ...existing, ...data };
  await Store.updateOne({ _id: storeId }, { $set: merged }).exec();
  return true;
};

const verifyStore = async (storeId, isVerified) => {
  const store = await Store.findByIdAndUpdate(
    storeId,
    { $set: { isVerified } },
    { new: true }
  ).populate("owner");

  if (!store) throw { status: 404, message: "Store not found" };

  return store;
};

const deleteStore = async (userId, storeId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw { status: 404, message: "NOT found" };

  const deleted = await Store.findByIdAndDelete(storeId);
  if (!deleted) throw { status: 404, message: "Seller not found" };

  //!delete Products
  //!delete Products from shoping Card

  return true;
};

module.exports = {
  getVerifiedStores,
  getAllStores,
  getStoresByOwner,
  createStore,
  updateStore,
  verifyStore,
  deleteStore,
};