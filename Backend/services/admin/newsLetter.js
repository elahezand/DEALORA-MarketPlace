const Newsletter = require("../../models/newsLetter");
const { paginate } = require("../../utils/helper");

async function getAll(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? Object.fromEntries(searchParams.entries())
    : (searchParams || {});

  return await paginate(Newsletter, {
    limit: params.limit,
    cursor: params.cursor,
  });
}

module.exports = {
  getAll,
};
