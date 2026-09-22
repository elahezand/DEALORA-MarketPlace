const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getAllStores = async ({ limit, cursor }) => {
  if (limit && Number(limit) > 50) {
    throw new AppError(400, "limit must be <= 50");
  }

  return paginate(Store, {
    limit,
    cursor,
    populate: "owner",
    sort: { _id: -1 }
  });
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

module.exports = {
  getAllStores,
  verifyStore,
};
