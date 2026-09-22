const Withdrawal = require("../../models/withdrawal");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getAllWithdrawals = async (query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return paginate(Withdrawal, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "store", select: "name owner" }],
    sort: { _id: -1 }
  });
};

const processWithdrawal = async (id, adminId, data) => {
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) throw new AppError(404, "Withdrawal not found");

  if (withdrawal.status === "completed" || withdrawal.status === "rejected") {
    throw new AppError(400, "This withdrawal has already been finalized");
  }

  if (data.status === "rejected") {
    const store = await Store.findById(withdrawal.store);
    if (store) {
      store.wallet.balance = (store.wallet?.balance || 0) + withdrawal.amount;
      await store.save();
    }
    withdrawal.rejectReason = data.rejectReason;
  }

  if (data.status === "completed") {
    withdrawal.trackingCode = data.trackingCode || null;
  }

  withdrawal.status = data.status;
  withdrawal.processedBy = adminId;
  withdrawal.processedAt = new Date();

  await withdrawal.save();
  return withdrawal;
};

module.exports = {
  getAllWithdrawals,
  processWithdrawal,
};
