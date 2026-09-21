const Coupon = require("../../models/coupon");
const AppError = require("../../utils/AppError");

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
  validateCoupon,
};
