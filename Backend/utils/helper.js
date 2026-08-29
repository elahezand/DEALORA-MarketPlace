const mongoose = require("mongoose");

const paginate = async (
  Model,
  {
    limit,
    cursor = null,
    filters = {},
    sort = { createdAt: -1 },
    populate = null,
    select = null,
    cursorField = "_id",
  } = {}
) => {
  limit = Math.min(Math.max(Number(limit), 1), 50);

  const query = { ...filters };

  if (cursor) {
    const sortKey = Object.keys(sort)[0] || "_id";
    const sortOrder = sort[sortKey];

    query[sortKey] = sortOrder === 1
      ? { $gt: cursor }
      : { $lt: cursor };
  }

  let dbQuery = Model.find(query)
    .sort(sort)
    .limit(limit)
    .lean();

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }

  if (select) {
    dbQuery = dbQuery.select(select);
  }

  const data = await dbQuery;
  const nextCursor =
    data.length === limit
      ? data[data.length - 1][cursorField]
      : null;

  return {
    data,
    pagination: {
      limit,
      nextCursor,
      hasMore: data.length === limit,
    },
  };
};

module.exports = paginate;