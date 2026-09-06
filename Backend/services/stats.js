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
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

/* Build an array of the last `days` day-buckets (oldest first), each as "YYYY-MM-DD" */
function buildDayBuckets(days) {
  const buckets = [];
  const start = getStartOfToday();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    buckets.push(d.toISOString().slice(0, 10));
  }
  return buckets;
}

/* Group a model's documents created in the last `days` days by day, using `dateField` */
async function countByDay(Model, days, extraMatch = {}, dateField = "createdAt") {
  const since = new Date(getStartOfToday());
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await Model.aggregate([
    { $match: { ...extraMatch, [dateField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [r._id, r.count]));
  return buildDayBuckets(days).map((day) => ({ day, count: map.get(day) || 0 }));
}

/* ADMIN — orders & new users per day, for dashboard charts */
const getAdminStatsTimeseries = async (days = 14) => {
  const rangeDays = Math.min(Math.max(Number(days) || 14, 7), 90);

  const [orders, users] = await Promise.all([
    countByDay(Order, rangeDays),
    countByDay(User, rangeDays),
  ]);

  return {
    days: rangeDays,
    labels: orders.map((r) => r.day),
    orders: orders.map((r) => r.count),
    newUsers: users.map((r) => r.count),
  };
};

const getUserStatsTimeseries = async (userId, days = 14) => {
  const rangeDays = Math.min(Math.max(Number(days) || 14, 7), 90);

  const orders = await countByDay(Order, rangeDays, { user: userId });

  return {
    days: rangeDays,
    labels: orders.map((r) => r.day),
    orders: orders.map((r) => r.count),
  };
};

module.exports = {
  getPublicStats,
  getAdminStats,
  getAdminStatsTimeseries,
  getUserStatsTimeseries,
};