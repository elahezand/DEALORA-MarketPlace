const Newsletter = require("../models/newsLetter");

// SUBSCRIBE
async function subscribe(email) {
  const exists = await Newsletter.findOne({ email });

  if (exists) {
    throw { status: 409, message: "Email already subscribed" };
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