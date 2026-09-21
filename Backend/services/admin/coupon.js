const Coupon = require("../../models/coupon");
const {paginate} = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getCoupons = async (query = {}) => {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.type) filter.type = query.type;

  const limit = Math.min(Number(query.limit) || 15, 100);
  return paginate(Coupon, { limit, cursor: query.cursor, filters: filter });
};

const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
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

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
