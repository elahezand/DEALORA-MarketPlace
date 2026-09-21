const publicStatsService = require("../../services/public/stats");

const getPublic = async (req, res, next) => {
  try {
    const data = await publicStatsService.getPublicStats();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getPublic,
};
