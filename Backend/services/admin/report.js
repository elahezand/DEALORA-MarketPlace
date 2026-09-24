const Report = require("../../models/report");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildListQuery, listLimit } = require("../../utils/listQuery");

const getAllReports = async (query = {}) => {
  const filters = buildListQuery(query, {
    statuses: ["pending", "reviewed", "resolved", "rejected"],
    search: ["description"],
  });
  if (query.targetType) filters.targetType = query.targetType;
  if (query.reason) filters.reason = query.reason;

  const limit = listLimit(query, 15);

  return paginate(Report, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "reporter", select: "username phone" }],
    sort: { _id: -1 }
  });
};

const getReportById = async (id) => {
  const report = await Report.findById(id).populate("reporter", "username phone");
  if (!report) throw new AppError(404, "Report not found");
  return report;
};

const resolveReport = async (id, adminId, data) => {
  const report = await Report.findById(id);
  if (!report) throw new AppError(404, "Report not found");

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
  getAllReports,
  getReportById,
  resolveReport,
};
