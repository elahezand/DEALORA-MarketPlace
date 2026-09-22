/* withdrawal — SELLER — store owners */
const Withdrawal = require("../../models/withdrawal");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

/* === SELLER: create a withdrawal request === */
const createWithdrawal = async (userId, data) => {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw new AppError(404, "Store not found");

  const updatedStore = await Store.findOneAndUpdate(
    { _id: store._id, "wallet.balance": { $gte: data.amount } },
    { $inc: { "wallet.balance": -data.amount } },
    { new: true }
  );

  if (!updatedStore) {
    throw new AppError(400, "Insufficient wallet balance");
  }

  try {
    const withdrawal = await Withdrawal.create({
      store: store._id,
      amount: data.amount,
      bankAccount: data.bankAccount,
    });

    return withdrawal;
  } catch (err) {
    await Store.updateOne(
      { _id: store._id },
      { $inc: { "wallet.balance": data.amount } }
    );
    throw err;
  }
};

/* === SELLER: list own withdrawal requests === */
const getMyWithdrawals = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw new AppError(404, "Store not found");

  const filters = { store: store._id };
  if (query.status) filters.status = query.status;

  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 50);
  return paginate(Withdrawal, {
    limit, cursor: query.cursor, filters, sort: { _id: -1 }
  });
};

module.exports = {
  createWithdrawal,
  getMyWithdrawals,
};
