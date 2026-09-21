const adminReportService = require("../../services/admin/report");

const getAll = async (req, res, next) => {
  try {
    const result = await adminReportService.getAllReports(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const report = await adminReportService.getReportById(req.params.id);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const resolve = async (req, res, next) => {
  try {
    const report = await adminReportService.resolveReport(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  resolve,
};
