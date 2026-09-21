/* newsLetter — PUBLIC — no login needed */
const Newsletter = require("../../models/newsLetter");
const AppError = require("../../utils/AppError");

// SUBSCRIBE
async function subscribe(email) {
  const exists = await Newsletter.findOne({ email });

  if (exists) {
    throw new AppError(409, "Email already subscribed");
  }

  const newsletter = await Newsletter.create({ email });
  return newsletter;
}

module.exports = {
  subscribe,
};
