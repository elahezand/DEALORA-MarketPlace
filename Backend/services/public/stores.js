const Store = require("../../models/store");
const OfferSeller = require("../../models/offerSeller");
const Listing = require("../../models/listing");
const {paginate} = require("../../utils/helper");
const AppError = require("../../utils/AppError");

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
    .select("name slug logo address meta isVerified category")
    .populate("category", "_id title slug")
    .lean();

  if (!store) throw new AppError(404, "Store not found");

  const productIds = await OfferSeller.find({
    store: store._id,
    status: "accepted",
    stock: { $gt: 0 },
  }).distinct("productId");

  const products = await paginate(Listing, {
    limit: Math.min(Number(limit) || 12, 48),
    cursor,
    filters: {
      _id: { $in: productIds },
      listingType: "store_product",
      status: "active",
    },
    sort: { createdAt: -1 },
    select: "title slug minPrice listingType images condition shortIdentifier createdAt",
  }); 
  return { store, ...products };
};

module.exports = {
  getVerifiedStores,
  getStoreBySlug,
};