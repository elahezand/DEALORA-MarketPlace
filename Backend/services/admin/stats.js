const User = require("../../models/user");
const Store = require("../../models/store");
const Order = require("../../models/order");
const { countByDay } = require("../shared/stats");

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

module.exports = {
  getAdminStats,
  getAdminStatsTimeseries,
};
