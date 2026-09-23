const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const { buildDateFilter, getAdminSort } = require("../../utils/adminQuery");
const AppError = require("../../utils/AppError");

const getAllStores = async (query = {}) => {
  const { limit, cursor } = query;
  if (limit && Number(limit) > 50) {
    throw new AppError(400, "limit must be <= 50");
  }

  const filters = {};
  if (query.q) filters.name = { $regex: String(query.q).trim().slice(0, 100), $options: "i" };
  if (query.isVerified !== undefined) filters.isVerified = query.isVerified === "true";
  Object.assign(filters, buildDateFilter(query, "createdAt"));

  return paginate(Store, {
    limit,
    cursor,
    filters,
    populate: "owner",
    sort: getAdminSort(query, ["createdAt", "updatedAt"])
  });
};

const verifyStore = async (storeId, isVerified) => {
  const store = await Store.findByIdAndUpdate(
    storeId,
    { $set: { isVerified } },
    { returnDocument: "after" }
  ).populate("owner");

  if (!store) throw new AppError(404, "Store not found");

  return store;
};

module.exports = {
  getAllStores,
  verifyStore,
};
