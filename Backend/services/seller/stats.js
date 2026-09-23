const Store = require("../../models/store");
const Order = require("../../models/order");
const OfferSeller = require("../../models/offerSeller");
const AppError = require("../../utils/AppError");
const { buildDayBuckets } = require("../shared/stats");

function getStartOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/* SELLER — totals for the seller dashboard overview cards */
const getSellerStats = async (userId) => {
  const store = await Store.findOne({ owner: userId }).select("_id wallet").lean();
  if (!store) throw new AppError(404, "Store not found");

  const [revenueAgg, orderCountAgg, pendingOffers, acceptedOffers] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid", "items.seller": store._id } },
      { $unwind: "$items" },
      { $match: { "items.seller": store._id } },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$items.finalPrice", "$items.quantity"] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", "items.seller": store._id } },
      { $count: "count" },
    ]),
    OfferSeller.countDocuments({ store: store._id, status: "pending" }),
    OfferSeller.countDocuments({ store: store._id, status: "accepted" }),
  ]);

  return {
    totalRevenue: revenueAgg[0]?.revenue || 0,
    totalOrders: orderCountAgg[0]?.count || 0,
    walletBalance: store.wallet?.balance || 0,
    walletPending: store.wallet?.pending || 0,
    pendingOffers,
    acceptedOffers,
  };
};

/* SELLER — revenue & order count per day, for the dashboard sales chart */
const getSellerStatsTimeseries = async (userId, days = 14) => {
  const store = await Store.findOne({ owner: userId }).select("_id").lean();
  if (!store) throw new AppError(404, "Store not found");

  const rangeDays = Math.min(Math.max(Number(days) || 14, 7), 90);
  const since = new Date(getStartOfToday());
  since.setUTCDate(since.getUTCDate() - (rangeDays - 1));

  const rows = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        "items.seller": store._id,
        createdAt: { $gte: since },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.seller": store._id } },
    {
     
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          order: "$_id",
        },
        revenue: { $sum: { $multiply: ["$items.finalPrice", "$items.quantity"] } },
      },
    },
    {
      $group: {
        _id: "$_id.day",
        revenue: { $sum: "$revenue" },
        orders: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [r._id, r]));
  const labels = buildDayBuckets(rangeDays);

  return {
    days: rangeDays,
    labels,
    revenue: labels.map((day) => map.get(day)?.revenue || 0),
    orders: labels.map((day) => map.get(day)?.orders || 0),
  };
};

module.exports = {
  getSellerStats,
  getSellerStatsTimeseries,
};