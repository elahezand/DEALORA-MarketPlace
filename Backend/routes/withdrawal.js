const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/seller/withdrawal");
const adminController = require("../controllers/admin/withdrawal");
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const {
  createWithdrawalSchema,
  processWithdrawalSchema,
} = require("../validators/withdrawal");

/* SELLER */
router.post("/", authUser, authSeller, validate(createWithdrawalSchema), sellerController.create);
router.get("/mine", authUser, authSeller, sellerController.getMine);

/* ADMIN */
router.get("/admin",authUser, authAdmin, adminController.getAll);
router.patch(
  "/admin/:id/process",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(processWithdrawalSchema),
  adminController.process
);

module.exports = router;
