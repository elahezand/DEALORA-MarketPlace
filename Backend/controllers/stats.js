const service = require("../services/stats");

exports.getPublic = async (req, res, next) => {
  try {
    const data = await service.getPublicStats();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.getAdmin = async (req, res, next) => {
  try {
    const data = await service.getAdminStats();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.getAdminTimeseries = async (req, res, next) => {
  try {
    const data = await service.getAdminStatsTimeseries(req.query.days);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.getUserTimeseries = async (req, res, next) => {
  try {
    const data = await service.getUserStatsTimeseries(req.user._id, req.query.days);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};