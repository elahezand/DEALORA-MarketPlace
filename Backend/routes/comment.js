const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const router = express.Router();

const publicController = require("../controllers/public/comment");
const userController = require("../controllers/user/comment");
const adminController = require("../controllers/admin/comment");
const validateObjectId = require("../middlewares/objectId");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");

const {
  createCommentSchema,
  updateCommentByOwnerSchema,
  moderateCommentSchema,
  replySchema,
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
router.get("/admin",authUser, authAdmin, adminController.getAdmin);

router.patch(
  "/:id/moderate",
  authUser,
  authAdmin,
  actionRateLimit,
  validateObjectId("id"),
  validate(moderateCommentSchema),
  adminController.moderate
);

router.delete(
  "/:id",
  authUser,
  authAdmin,
  actionRateLimit,
  validateObjectId("id"),
  adminController.remove
);

router.post(
  "/:id/answer",
  authUser,
  authAdmin,
  actionRateLimit,
  validateObjectId("id"),
  validate(replySchema),
  adminController.reply
);

// PUBLIC
router.get(
  "/listing/:listing",
  validateObjectId("listing"),
  cacheMiddleware(120),
  publicController.getByListing
);

// USER
router.post(
  "/",
  authUser,
  commentRateLimit,
  validate(createCommentSchema),
  userController.create
);

router.patch(
  "/:id",
  authUser,
  actionRateLimit,
  validateObjectId("id"),
  validate(updateCommentByOwnerSchema),
  userController.patch
);

router.delete(
  "/:id",
  authUser,
  actionRateLimit,
  validateObjectId("id"),
  userController.removeOwn
);

module.exports = router;