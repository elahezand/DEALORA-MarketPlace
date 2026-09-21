const userStatsService = require("../../services/user/stats");

const getUserTimeseries = async (req, res, next) => {
  try {
    const data = await userStatsService.getUserStatsTimeseries(req.user._id, req.query.days);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getUserTimeseries,
};
