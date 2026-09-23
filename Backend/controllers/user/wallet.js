const User = require("../../models/user");
const WalletTransaction = require("../../models/walletTransaction");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getMyWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("wallet").lean();
    if (!user) return next(new AppError(404, "User not found"));

    const result = await paginate(WalletTransaction, {
      limit: req.query.limit,
      cursor: req.query.cursor,
      filters: { user: req.user._id },
      populate: {
        path: "order",
        select: "_id status paymentStatus refundAmount refundedAt createdAt",
      },
      sort: { createdAt: -1 },
    });

    res.status(200).json({
      success: true,
      balance: user.wallet?.balance || 0,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyWallet };
