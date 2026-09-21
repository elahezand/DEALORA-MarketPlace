const sellerWithdrawalService = require("../../services/seller/withdrawal");
const create = async (req, res, next) => {
  try {
    const withdrawal = await sellerWithdrawalService.createWithdrawal(req.user._id, req.parsed.data);
    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: withdrawal,
    });
  } catch (err) {
    next(err);
  }
};

const getMine = async (req, res, next) => {
  try {
    const result = await sellerWithdrawalService.getMyWithdrawals(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getMine,
};
