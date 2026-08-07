// controllers/coupon.js
const couponService = require("../services/coupon");

/* ADMIN */
exports.getAll = async (req, res, next) => {
  try {
    const result = await couponService.getCoupons(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.parsed?.data || req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.parsed?.data || req.body);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (e) { next(e); }
};

/* USER */
exports.validate = async (req, res, next) => {
  try {
    const coupon = await couponService.validateCoupon(req.params.code);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};