const adminWithdrawalService = require("../../services/admin/withdrawal");

const getAll = async (req, res, next) => {
  try {
    const result = await adminWithdrawalService.getAllWithdrawals(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const process = async (req, res, next) => {
  try {
    const withdrawal = await adminWithdrawalService.processWithdrawal(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(200).json({ success: true, data: withdrawal });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  process,
};
