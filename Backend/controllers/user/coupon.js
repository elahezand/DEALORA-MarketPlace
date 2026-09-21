const userCouponService = require("../../services/user/coupon");
const validate = async (req, res, next) => {
  try {
    const coupon = await userCouponService.validateCoupon(req.params.code);
    res.status(200).json({ success: true, data: coupon });
  } catch (e) { next(e); }
};

module.exports = {
  validate,
};
