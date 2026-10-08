const Store = require("../../models/store");
const UserModel = require("../../models/user");
const AppError = require("../../utils/AppError");
const { assertTopLevelCategory, uniqueStoreSlug, stripProtectedStoreFields } = require("../shared/stores");

const createStore = async (userId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(404, "NOT found");

  // withdrawals, stats and the seller dashboard all assume one store per owner
  if (await Store.exists({ owner: userId })) {
    throw new AppError(409, "You already have a store");
  }

  await assertTopLevelCategory(data.category);

  const safeData = stripProtectedStoreFields(data);
  safeData.slug = await uniqueStoreSlug(data.slug, data.name);

  const newStore = await Store.create({ ...safeData, owner: userId });

  try {
    // user.store is what /auth/me populates — without it the seller dashboard shows "no store"
    await UserModel.updateOne(
      { _id: userId },
      { $addToSet: { role: "SELLER" }, $set: { store: newStore._id } }
    );
  } catch (err) {
    await Store.findByIdAndDelete(newStore._id).catch(() => {});
    throw err;
  }

  return newStore;
};

module.exports = {
  createStore,
};
