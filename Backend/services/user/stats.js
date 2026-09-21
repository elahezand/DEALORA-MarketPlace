const Order = require("../../models/order");
const { countByDay } = require("../shared/stats");

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
  getUserStatsTimeseries,
};
