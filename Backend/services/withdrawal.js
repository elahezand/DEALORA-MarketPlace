const mongoose = require("mongoose");
const Withdrawal = require("../models/withdrawal");
const Store = require("../models/store");
const { paginate } = require("../utils/helper");
const AppError = require("../utils/AppError");

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
  return paginate(Withdrawal, { limit, cursor: query.cursor, filters });
};

/* === ADMIN: list all withdrawal requests === */
const getAllWithdrawals = async (query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return paginate(Withdrawal, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [{ path: "store", select: "name owner" }],
  });
};

/* === ADMIN: process (approve/complete/reject) a withdrawal === */
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
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
};