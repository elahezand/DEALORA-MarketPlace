const AppError = require("./AppError");

const parseDate = (value, name) => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new AppError(400, `Invalid ${name}`);
  return date;
};

const buildDateFilter = (query = {}, field = "createdAt") => {
  const from = parseDate(query.dateFrom ?? query.from, "dateFrom");
  const toRaw = query.dateTo ?? query.to;
  const to = parseDate(toRaw, "dateTo");
  if (!from && !to) return {};
  if (from && to && from > to) throw new AppError(400, "dateFrom must be before dateTo");

  const range = {};
  if (from) range.$gte = from;
  if (to) {
    const end = new Date(to);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(toRaw))) {
      end.setHours(23, 59, 59, 999);
    }
    range.$lte = end;
  }
  return { [field]: range };
};

const getAdminSort = (query = {}, allowed = ["createdAt", "updatedAt"]) => {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = String(query.sortOrder).toLowerCase() === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder };
};

module.exports = { buildDateFilter, getAdminSort };
