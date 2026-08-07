const express = require("express");
const router = express.Router();
const controller = require("../controllers/coupon");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { createCouponSchema, updateCouponSchema } =require( "../validators/coupon");
/* ADMIN */
router.get("/admin",authUser, authAdmin, controller.getAll);
router.get("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), controller.getById);
router.post("/admin", authUser,authAdmin, validate(createCouponSchema), controller.create);
router.patch("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), validate(updateCouponSchema), controller.update);
router.delete("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), controller.remove);

router.get("/validate/:code", authUser, controller.validate);

module.exports = router;