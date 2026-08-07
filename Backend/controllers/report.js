const reportService = require("../services/report");

/* USER */
exports.create = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.user._id, req.parsed.data);
    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyReports = async (req, res, next) => {
  try {
    const result = await reportService.getMyReports(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/* ADMIN */
exports.getAll = async (req, res, next) => {
  try {
    const result = await reportService.getAllReports(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

exports.resolve = async (req, res, next) => {
  try {
    const report = await reportService.resolveReport(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
