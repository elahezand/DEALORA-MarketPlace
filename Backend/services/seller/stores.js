/* stores — SELLER — store owners */
const Store = require("../../models/store");
const UserModel = require("../../models/user");
const AppError = require("../../utils/AppError");

/*  SELLER  */
const getStoresByOwner = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const shopsSeller = await Store.find({ owner: userId });
  return shopsSeller;
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

  if (Object.keys(safeData).length === 0) return true;

  await Store.updateOne({ _id: storeId }, { $set: safeData }).exec();
  return true;
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
  getStoresByOwner,
  updateStore,
  deleteStore,
};
