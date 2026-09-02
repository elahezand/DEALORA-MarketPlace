const Newsletter = require("../models/newsLetter");
const AppError = require("../utils/AppError");
const { paginate } = require("../utils/helper");

// SUBSCRIBE
async function subscribe(email) {
  const exists = await Newsletter.findOne({ email });

  if (exists) {
    throw new AppError(409, "Email already subscribed");
  }

  const newsletter = await Newsletter.create({ email });
  return newsletter;
}

// GET ALL
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
  subscribe,
  getAll,
};