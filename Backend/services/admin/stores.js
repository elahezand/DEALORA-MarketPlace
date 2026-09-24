const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildListQuery, listLimit, dateRangeFilter } = require("../../utils/listQuery");

const getAllStores = async (query = {}) => {
  const filters = buildListQuery(query, {
    search: ["name", "slug", "phone"],
    ids: { category: "category", owner: "owner" },
  });
  if (query.isVerified !== undefined && query.isVerified !== "all") {
    filters.isVerified = query.isVerified === "true";
  }

  return paginate(Store, {
    limit: listLimit(query, 20, 50),
    cursor: query.cursor,
    filters,
    populate: "owner",
    sort: { _id: -1 }
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
