const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/report");
const adminController = require("../controllers/admin/report");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { createReportSchema, resolveReportSchema } = require("../validators/report");

/* USER */
router.post("/", authUser, validate(createReportSchema), userController.create);
router.get("/mine", authUser, userController.getMyReports);

/* ADMIN */
router.get("/admin",authUser, authAdmin, adminController.getAll);
router.get("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), adminController.getById);
router.patch(
  "/admin/:id/resolve",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(resolveReportSchema),
  adminController.resolve
);

module.exports = router;
