const express = require("express");
const articleRouter = express.Router();

const controller = require("../controllers/article");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");

const { createArticleSchema, updateArticleSchema } = require("../validators/article");

/* ─── ADMIN — must come before "/:id" ─────────────────────────────────── */
articleRouter.get("/admin", authUser, authAdmin, controller.getAllAdmin);
articleRouter.get(
  "/admin/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  controller.getOneAdmin
);

articleRouter.post(
  "/",
  authUser,
  authAdmin,
  validate(createArticleSchema),
  controller.create
);

articleRouter.patch(
  "/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(updateArticleSchema),
  controller.update
);

articleRouter.delete(
  "/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  controller.remove
);

/* ─── PUBLIC ──────────────────────────────────────────────────────────── */
articleRouter.get("/", cacheMiddleware(120), controller.getAll);
articleRouter.get("/:id", validateObjectIdParam("id"), cacheMiddleware(120), controller.getOne);

module.exports = articleRouter;
