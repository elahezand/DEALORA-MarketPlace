const withdrawalService = require("../services/withdrawal");

/* SELLER */
exports.create = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.createWithdrawal(req.user._id, req.parsed.data);
    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: withdrawal,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const result = await withdrawalService.getMyWithdrawals(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/* ADMIN */
exports.getAll = async (req, res, next) => {
  try {
    const result = await withdrawalService.getAllWithdrawals(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.process = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.processWithdrawal(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(200).json({ success: true, data: withdrawal });
  } catch (err) {
    next(err);
  }
};
