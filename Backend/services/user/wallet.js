const User = require("../../models/user");
const WalletTransaction = require("../../models/walletTransaction");
const { paginate } = require("../../utils/helper");
const { buildListQuery, listLimit } = require("../../utils/listQuery");
const AppError = require("../../utils/AppError");

/* Balance + history for the user's wallet panel */
const getMyWallet = async (userId, query = {}) => {
  const user = await User.findById(userId).select("wallet").lean();
  if (!user) throw new AppError(404, "User not found");

  const filters = buildListQuery(query, {
    base: { user: userId },
    statuses: ["spend", "refund"],
    statusField: "type",
  });

  const result = await paginate(WalletTransaction, {
    limit: listLimit(query, 20),
    cursor: query.cursor,
    filters,
    populate: [{ path: "order", select: "_id status paymentStatus pricing createdAt" }],
    sort: { _id: -1 },
  });

  const totals = await WalletTransaction.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  const sum = (type) => totals.find((t) => t._id === type)?.total || 0;

  return {
    balance: user.wallet?.balance || 0,
    totals: { refunded: sum("refund"), spent: sum("spend") },
    ...result,
  };
};

module.exports = {
  getMyWallet,
};
