const Listing = require("../models/listing");
const User = require("../models/user");
const Store = require("../models/store");
const Order = require("../models/order");

const PUBLISHED_LISTING_FILTER = {
  $or: [
    { listingType: "user_ad", status: "accepted" },
    { listingType: "store_product", status: "active" },
  ],
};
function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const getPublicStats = async () => {
  const [activeListings, activeUsers, cityRows, successfulDeals, todayListings] =
    await Promise.all([
      Listing.countDocuments(PUBLISHED_LISTING_FILTER),
      User.countDocuments(),
      Listing.distinct("location.city", {
        listingType: "user_ad",
        "location.city": { $ne: null },
      }),
      Listing.countDocuments({
        ...PUBLISHED_LISTING_FILTER,
        "metrics.sold": { $gt: 0 },
      }),
      Listing.countDocuments({
        ...PUBLISHED_LISTING_FILTER,
        createdAt: { $gte: getStartOfToday() },
      }),
    ]);

  return {
    activeListings,
    activeUsers,
    citiesCovered: cityRows.length,
    successfulDeals,
    todayListings,
  };
};


/*  ADMIN ONLY  */
const getAdminStats = async () => {
  const [totalUsers, totalStores, totalOrders, verifiedStores] =
    await Promise.all([
      User.countDocuments(),
      Store.countDocuments(),
      Order.countDocuments(),
      Store.countDocuments({ isVerified: true }),
    ]);

  return {
    totalUsers,
    totalStores,
    totalOrders,
    pendingStoreVerifications: totalStores - verifiedStores,
  };
};

module.exports = { getAdminStats };
module.exports = { getPublicStats, getAdminStats };