const sellerStatsService = require("../../services/seller/stats");

const getSeller = async (req, res, next) => {
  try {
    const data = await sellerStatsService.getSellerStats(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getSellerTimeseries = async (req, res, next) => {
  try {
    const data = await sellerStatsService.getSellerStatsTimeseries(req.user._id, req.query.days);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getSeller,
  getSellerTimeseries,
};
