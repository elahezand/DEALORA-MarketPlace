const service = require("../services/stats");

exports.get = async (req, res, next) => {
  try {
    const data = await service.getPublicStats();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};