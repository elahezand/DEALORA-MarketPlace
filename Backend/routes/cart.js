const express = require("express");
const cartRouter = express.Router();
const controller = require("../controllers/cart");
const validateObjectIdParam = require("../middlewares/objectId");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { addToCartSchema, updateCartSchema } = require("../validators/cart");

/* ─── ADMIN  */
cartRouter.get("/admin", authAdmin, controller.getAdmin);
cartRouter.get("/admin/:id", authAdmin, validateObjectIdParam("id"), controller.getByIdAdmin);
cartRouter.delete("/admin/:id", authAdmin, validateObjectIdParam("id"), controller.remove);

/* ─── USER  */
cartRouter.get("/me", authUser, controller.getMyCart);

cartRouter.post(
  "/me/items",
  authUser,
  validate(addToCartSchema),
  controller.addToCart
);

cartRouter.delete(
  "/me/items/:offerId",
  authUser,
  validateObjectIdParam("offerId"),
  controller.removeFromCart
);

cartRouter.patch(
  "/me",
  authUser,
  validate(updateCartSchema),
  controller.updateCart
);

cartRouter.delete("/me", authUser, controller.clearMyCart);

module.exports = cartRouter;