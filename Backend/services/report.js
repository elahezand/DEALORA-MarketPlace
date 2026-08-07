const mongoose = require("mongoose");
const Report = require("../models/report");
const paginate = require("../utils/helper");

const isValidId = mongoose.Types.ObjectId.isValid;

/* === USER: create a new report === */
const createReport = async (reporterId, data) => {
  if (!isValidId(data.targetId)) {
    throw { status: 400, message: "Invalid targetId" };
  }

  try {
    const report = await Report.create({
      reporter: reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description,
    });
    return report;
  } catch (err) {
    if (err.code === 11000) {
      throw { status: 409, message: "You have already reported this item" };
    }
    throw err;
  }
};

const getMyReports = async (reporterId, query = {}) => {
  const filters = { reporter: reporterId };
  if (query.status) filters.status = query.status;

  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 50);
  return paginate(Report, { limit, cursor: query.cursor, filters });
};

/* === ADMIN: list all reports, filterable === */
const getAllReports = async (query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.targetType) filters.targetType = query.targetType;
  if (query.reason) filters.reason = query.reason;

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return paginate(Report, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "reporter", select: "username phone" }],
  });
};

/* === ADMIN: get one report by id === */
const getReportById = async (id) => {
  const report = await Report.findById(id).populate("reporter", "username phone");
  if (!report) throw { status: 404, message: "Report not found" };
  return report;
};

/* === ADMIN: resolve / update status of a report === */
const resolveReport = async (id, adminId, data) => {
  const report = await Report.findById(id);
  if (!report) throw { status: 404, message: "Report not found" };

  report.status = data.status;
  report.resolution = {
    resolvedBy: adminId,
    resolvedAt: new Date(),
    note: data.note || null,
    actionTaken: data.actionTaken || "none",
  };

  await report.save();
  return report;
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  resolveReport,
};
