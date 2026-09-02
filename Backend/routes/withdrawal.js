const express = require("express");
const router = express.Router();
const controller = require("../controllers/withdrawal");
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const {
  createWithdrawalSchema,
  processWithdrawalSchema,
} = require("../validators/withdrawal");

/* SELLER */
router.post("/", authUser, authSeller, validate(createWithdrawalSchema), controller.create);
router.get("/mine", authUser, authSeller, controller.getMine);

/* ADMIN */
router.get("/admin",authUser, authAdmin, controller.getAll);
router.patch(
  "/admin/:id/process",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(processWithdrawalSchema),
  controller.process
);

module.exports = router;
