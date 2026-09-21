const userReportService = require("../../services/user/report");

const create = async (req, res, next) => {
  try {
    const report = await userReportService.createReport(req.user._id, req.parsed.data);
    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const result = await userReportService.getMyReports(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getMyReports,
};
