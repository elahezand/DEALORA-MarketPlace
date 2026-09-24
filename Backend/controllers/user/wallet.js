const userWalletService = require("../../services/user/wallet");

const getMyWallet = async (req, res, next) => {
  try {
    const result = await userWalletService.getMyWallet(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyWallet,
};
