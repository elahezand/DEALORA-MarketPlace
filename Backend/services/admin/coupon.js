const Coupon = require("../../models/coupon");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildListQuery, listLimit } = require("../../utils/listQuery");
const { MAX_PERCENT } = require("../../validators/coupon");

const getCoupons = async (query = {}) => {
  const filter = {};
  Object.assign(filter, buildListQuery(query, { search: ["code"] }));
  if (query.isActive !== undefined && query.isActive !== "all") filter.isActive = query.isActive === "true";
  if (query.type && query.type !== "all") filter.type = query.type;

  const limit = listLimit(query, 15);
  return paginate(Coupon, {
    limit, cursor: query.cursor, filters: filter, sort: { _id: -1 }
  });
};

const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  return coupon;
};

const createCoupon = async (data) => {
  const code = String(data.code).trim().toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) throw new AppError(409, "Coupon code already exists");

  return Coupon.create({ ...data, code });
};

const updateCoupon = async (id, data) => {
  const current = await Coupon.findById(id).select("type amount startsAt expiresAt usedCount").lean();
  if (!current) throw new AppError(404, "Coupon not found");

  const startsAt = data.startsAt !== undefined ? data.startsAt : current.startsAt;
  const expiresAt = data.expiresAt !== undefined ? data.expiresAt : current.expiresAt;
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    throw new AppError(400, "expiresAt must be later than startsAt");
  }
  // ONLY THE AMOUNT OR ONLY THE TYPE MAY CHANGE → CHECK WITH THE SAVED ONE
  const type = data.type ?? current.type;
  const amount = data.amount ?? current.amount;
  if (type === "percent" && amount > MAX_PERCENT) {
    throw new AppError(400, `A percent coupon can be at most ${MAX_PERCENT}%`);
  }
  if (data.usageLimit != null && data.usageLimit < (current.usedCount || 0)) {
    throw new AppError(400, `usageLimit can't be below the ${current.usedCount} uses already made`);
  }

  const coupon = await Coupon.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
  if (!coupon) throw new AppError(404, "Coupon not found");
  return coupon;
};

const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  return true;
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};