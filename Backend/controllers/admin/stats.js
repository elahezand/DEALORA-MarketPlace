const adminStatsService = require("../../services/admin/stats");

const getAdmin = async (req, res, next) => {
  try {
    const data = await adminStatsService.getAdminStats();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getAdminTimeseries = async (req, res, next) => {
  try {
    const data = await adminStatsService.getAdminStatsTimeseries(req.query.days);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAdmin,
  getAdminTimeseries,
};
