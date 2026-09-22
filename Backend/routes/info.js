const express = require("express");
const router = express.Router();

const publicController = require("../controllers/public/info");
const adminController = require("../controllers/admin/info");
const { authAdmin,authUser } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const {
  createInfoSchema,
  updateInfoSchema,
} = require("../validators/info");

/* PUBLIC */
router.get("/", publicController.get);

/* ADMIN */
router.post(
  "/",
  authUser,
  authAdmin,
  validate(createInfoSchema),
  adminController.post
);

router.patch(
  "/",
  authUser,
  authAdmin,
  validate(updateInfoSchema),
  adminController.patch
);

router.delete(
  "/",
  authUser,
  authAdmin,
  adminController.remove
);

module.exports = router;