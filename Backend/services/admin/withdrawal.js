const Withdrawal = require("../../models/withdrawal");
const Store = require("../../models/store");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildListQuery, listLimit } = require("../../utils/listQuery");

const getAllWithdrawals = async (query = {}) => {
  const filters = buildListQuery(query, {
    statuses: ["pending", "processing", "completed", "rejected"],
    ids: { store: "store" },
  });

  const limit = listLimit(query, 20);
  return paginate(Withdrawal, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "store", select: "name owner" }],
    sort: { _id: -1 }
  });
};

const processWithdrawal = async (id, adminId, data) => {
  const set = {
    status: data.status,
    processedBy: adminId,
    processedAt: new Date(),
  };
  if (data.status === "rejected") set.rejectReason = data.rejectReason;
  if (data.status === "completed") set.trackingCode = data.trackingCode || null;

  // claim + change in ONE atomic step: two clicks / two admins can't both reject it
  // (which used to give the money back twice)
  const withdrawal = await Withdrawal.findOneAndUpdate(
    { _id: id, status: { $in: ["pending", "processing"] } },
    { $set: set },
    { returnDocument: "after" }
  );

  if (!withdrawal) {
    const exists = await Withdrawal.exists({ _id: id });
    if (!exists) throw new AppError(404, "Withdrawal not found");
    throw new AppError(409, "This withdrawal has already been finalized");
  }

  if (data.status === "rejected") {
    await Store.updateOne({ _id: withdrawal.store }, { $inc: { "wallet.balance": withdrawal.amount } });
  }

  return withdrawal;
};

module.exports = {
  getAllWithdrawals,
  processWithdrawal,
};
