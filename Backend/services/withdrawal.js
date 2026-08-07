const mongoose = require("mongoose");
const Withdrawal = require("../models/withdrawal");
const Store = require("../models/store");
const paginate = require("../utils/helper");

/* === SELLER: create a withdrawal request === */
const createWithdrawal = async (userId, data) => {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw { status: 404, message: "Store not found" };

  const balance = store.wallet?.balance || 0;
  if (data.amount > balance) {
    throw { status: 400, message: "Insufficient wallet balance" };
  }

  store.wallet.balance = balance - data.amount;
  await store.save();

  const withdrawal = await Withdrawal.create({
    store: store._id,
    amount: data.amount,
    bankAccount: data.bankAccount,
  });

  return withdrawal;
};

/* === SELLER: list own withdrawal requests === */
const getMyWithdrawals = async (userId, query = {}) => {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw { status: 404, message: "Store not found" };

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
  if (!withdrawal) throw { status: 404, message: "Withdrawal not found" };

  if (withdrawal.status === "completed" || withdrawal.status === "rejected") {
    throw { status: 400, message: "This withdrawal has already been finalized" };
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
