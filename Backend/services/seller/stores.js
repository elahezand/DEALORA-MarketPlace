/* stores — SELLER — store owners */
const Store = require("../../models/store");
const UserModel = require("../../models/user");
const OfferSeller = require("../../models/offerSeller");
const AppError = require("../../utils/AppError");
const { assertTopLevelCategory, uniqueStoreSlug, stripProtectedStoreFields } = require("../shared/stores");

/*  SELLER  */
const getStoresByOwner = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  const shopsSeller = await Store.find({ owner: userId }).populate("category", "_id title slug");
  return shopsSeller;
};

const updateStore = async (userId, storeId, data) => {
  const existing = await Store.findById(storeId).lean();
  if (!existing) throw new AppError(404, "NOT found");

  if (String(existing.owner) !== String(userId)) {
    throw new AppError(403, "You do not have permission to update this store");
  }

  // owners can't verify themselves, change ratings, move the store to another user or touch the wallet
  const safeData = stripProtectedStoreFields(data);

  if (Object.keys(safeData).length === 0) return true;

  if (safeData.category) await assertTopLevelCategory(safeData.category);
  if (safeData.slug !== undefined) {
    safeData.slug = await uniqueStoreSlug(safeData.slug, safeData.name || existing.name, storeId);
  }

  await Store.updateOne({ _id: storeId }, { $set: safeData }, { runValidators: true });
  return true;
};

const deleteStore = async (userId, storeId) => {
  const existing = await Store.findById(storeId);
  if (!existing) throw new AppError(404, "Store not found");

  if (String(existing.owner) !== String(userId)) {
    throw new AppError(403, "You do not have permission to delete this store");
  }

  // deleting would destroy money that belongs to the seller
  if ((existing.wallet?.balance || 0) > 0 || (existing.wallet?.pending || 0) > 0) {
    throw new AppError(409, "Withdraw your balance and wait for pending orders before deleting the store");
  }

  await OfferSeller.updateMany(
    { store: storeId, status: { $in: ["pending", "accepted"] } },
    { $set: { status: "rejected", adminComment: "Store deleted by owner" } }
  );
  await Store.findByIdAndDelete(storeId);
  await UserModel.updateOne({ _id: userId }, { $set: { store: null }, $pull: { role: "SELLER" } });

  return true;
};

module.exports = {
  getStoresByOwner,
  updateStore,
  deleteStore,
};
