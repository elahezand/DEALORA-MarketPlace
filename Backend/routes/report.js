const express = require("express");
const router = express.Router();
const controller = require("../controllers/report");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { createReportSchema, resolveReportSchema } = require("../validators/report");

/* USER */
router.post("/", authUser, validate(createReportSchema), controller.create);
router.get("/mine", authUser, controller.getMyReports);

/* ADMIN */
router.get("/admin",authUser, authAdmin, controller.getAll);
router.get("/admin/:id", authUser,authAdmin, validateObjectIdParam("id"), controller.getById);
router.patch(
  "/admin/:id/resolve",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(resolveReportSchema),
  controller.resolve
);

module.exports = router;
