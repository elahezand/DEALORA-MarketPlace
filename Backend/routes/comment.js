const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const router = express.Router();

const controller = require("../controllers/comment");
const validateObjectId = require("../middlewares/objectId");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");

const {
  createCommentSchema,
  updateCommentByOwnerSchema,
  moderateCommentSchema,
} = require("../validators/comment");

// RATE LIMITS
const commentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many comments" },
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
});

const actionRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { message: "Too many actions" },
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
});

// ADMIN
router.get("/admin", authAdmin, controller.getAdmin);

router.patch(
  "/:id/moderate",
  authAdmin,
  actionRateLimit,
  validateObjectId("id"),
  validate(moderateCommentSchema),
  controller.moderate
);

router.delete(
  "/:id",
  authAdmin,
  actionRateLimit,
  validateObjectId("id"),
  controller.remove
);

// PUBLIC
router.get(
  "/product/:productId",
  validateObjectId("productId"),
  cacheMiddleware(120),
  controller.getByProduct
);

// USER
router.post(
  "/",
  authUser,
  commentRateLimit,
  validate(createCommentSchema),
  controller.create
);

router.patch(
  "/:id",
  authUser,
  actionRateLimit,
  validateObjectId("id"),
  validate(updateCommentByOwnerSchema),
  controller.patch
);

router.delete(
  "/:id",
  authUser,
  actionRateLimit,
  validateObjectId("id"),
  controller.removeOwn
);

module.exports = router;