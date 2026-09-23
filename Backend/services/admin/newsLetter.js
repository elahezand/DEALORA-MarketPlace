const Newsletter = require("../../models/newsLetter");
const { paginate } = require("../../utils/helper");
const { buildDateFilter, getAdminSort } = require("../../utils/adminQuery");

async function getAll(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? Object.fromEntries(searchParams.entries())
    : (searchParams || {});

  const filters = {};
  Object.assign(filters, buildDateFilter(params, "createdAt"));
  return await paginate(Newsletter, {
    limit: params.limit,
    cursor: params.cursor,
    filters,
    sort: getAdminSort(params, ["createdAt", "updatedAt"])
  });
}

module.exports = {
  getAll,
};
