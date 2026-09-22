const mongoose = require("mongoose");
const Report = require("../../models/report");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const isValidId = mongoose.Types.ObjectId.isValid;

const createReport = async (reporterId, data) => {
  if (!isValidId(data.targetId)) {
    throw new AppError(400, "Invalid targetId");
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
      throw new AppError(409, "You have already reported this item");
    }
    throw err;
  }
};

const getMyReports = async (reporterId, query = {}) => {
  const filters = { reporter: reporterId };
  if (query.status) filters.status = query.status;

  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 50);
  return paginate(Report, {
    limit, cursor: query.cursor, filters, sort: { _id: -1 }
  });
};

module.exports = {
  createReport,
  getMyReports,
};
