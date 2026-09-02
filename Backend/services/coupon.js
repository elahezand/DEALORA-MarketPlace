const Coupon = require("../models/coupon");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

const getCoupons = async (query = {}) => {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.type) filter.type = query.type;

  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 100);
  return paginate(Coupon, { ...query, limit }, filter);
};

const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  return coupon;
};

const getCouponByCode = async (code) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new AppError(404, "Coupon not found");
  return coupon;
};

const createCoupon = async (data) => {
  const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AppError(409, "Coupon code already exists");

  return Coupon.create(data);
};

const updateCoupon = async (id, data) => {
  const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!coupon) throw new AppError(404, "Coupon not found");
  return coupon;
};

const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new AppError(404, "Coupon not found");
  return true;
};

const validateCoupon = async (code) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new AppError(404, "Coupon not found");

  const now = new Date();

  if (!coupon.isActive)
    throw new AppError(400, "Coupon is inactive");

  if (coupon.startsAt && coupon.startsAt > now)
    throw new AppError(400, "Coupon has not started yet");

  if (coupon.expiresAt && coupon.expiresAt < now)
    throw new AppError(400, "Coupon has expired");

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    throw new AppError(400, "Coupon usage limit reached");

  return coupon;
};

module.exports = {
  getCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};