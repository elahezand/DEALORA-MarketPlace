const express = require("express");
const router = express.Router();

const controller = require("../controllers/info");
const { authAdmin,authUser } = require("../middlewares/authMiddleware");
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
  authUser,
  authAdmin,
  validate(createInfoSchema),
  controller.post
);

router.patch(
  "/",
  authUser,
  authAdmin,
  validate(updateInfoSchema),
  controller.patch
);

router.delete(
  "/",
  authUser,
  authAdmin,
  controller.remove
);

module.exports = router;