const express = require("express");
const router = express.Router();

const controller = require("../controllers/info");
const { authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const {
  createInfoSchema,
  updateInfoSchema,
} = require("../validators/info");

/* PUBLIC */
router.get("/", controller.get);

/* ADMIN */
router.post(
  "/",
  authAdmin,
  validate(createInfoSchema),
  controller.post
);

router.patch(
  "/",
  authAdmin,
  validate(updateInfoSchema),
  controller.patch
);

router.delete(
  "/",
  authAdmin,
  controller.remove
);

module.exports = router;