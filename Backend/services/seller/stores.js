/* stores — SELLER — store owners */
const Store = require("../../models/store");
const UserModel = require("../../models/user");
const AppError = require("../../utils/AppError");
const { assertTopLevelCategory } = require("../shared/stores");

/*  SELLER  */
const getStoresByOwner = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const shopsSeller = await Store.find({ owner: userId }).populate("category", "_id title slug");
  return shopsSeller;
};

const updateStore = async (userId, storeId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const existing = await Store.findById(storeId).lean();
  if (!existing) throw new AppError(404, "NOT found");

  if (String(existing.owner) !== String(userId)) {
    throw new AppError(403, "You do not have permission to update this store");
  }

  const safeData = { ...data };

  if (Object.keys(safeData).length === 0) return true;

  if (safeData.category) await assertTopLevelCategory(safeData.category);

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


  return true;
};

module.exports = {
  getStoresByOwner,
  updateStore,
  deleteStore,
};
