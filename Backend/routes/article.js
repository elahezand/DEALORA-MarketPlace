const express = require("express");
const articleRouter = express.Router();

const publicController = require("../controllers/public/article");
const adminController = require("../controllers/admin/article");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");

const { createArticleSchema, updateArticleSchema } = require("../validators/article");

/* ─── ADMIN — must come before "/:id" ─────────────────────────────────── */
articleRouter.get("/admin", authUser, authAdmin, adminController.getAllAdmin);
articleRouter.get(
  "/admin/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  adminController.getOneAdmin
);

articleRouter.post(
  "/",
  authUser,
  authAdmin,
  validate(createArticleSchema),
  adminController.create
);

articleRouter.patch(
  "/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(updateArticleSchema),
  adminController.update
);

articleRouter.delete(
  "/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  adminController.remove
);

/* ─── PUBLIC ──────────────────────────────────────────────────────────── */
articleRouter.get("/", cacheMiddleware(120), publicController.getAll);
articleRouter.get("/:id", validateObjectIdParam("id"), cacheMiddleware(120), publicController.getOne);

module.exports = articleRouter;
