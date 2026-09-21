const adminCouponService = require("../../services/admin/coupon");

const getAll = async (req, res, next) => {
  try {
    const result = await adminCouponService.getCoupons(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const coupon = await adminCouponService.getCouponById(req.params.id);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const coupon = await adminCouponService.createCoupon(req.parsed?.data || req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const coupon = await adminCouponService.updateCoupon(req.params.id, req.parsed?.data || req.body);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await adminCouponService.deleteCoupon(req.params.id);
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (e) { next(e); }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
