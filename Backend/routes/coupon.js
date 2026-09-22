const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/coupon");
const adminController = require("../controllers/admin/coupon");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { createCouponSchema, updateCouponSchema } =require( "../validators/coupon");
/* ADMIN */
router.get("/admin",authUser, authAdmin, adminController.getAll);
router.get("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), adminController.getById);
router.post("/admin", authUser,authAdmin, validate(createCouponSchema), adminController.create);
router.patch("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), validate(updateCouponSchema), adminController.update);
router.delete("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), adminController.remove);

router.get("/validate/:code", authUser, userController.validate);

module.exports = router;