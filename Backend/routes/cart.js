const express = require("express");
const cartRouter = express.Router();
const userController = require("../controllers/user/cart");
const adminController = require("../controllers/admin/cart");
const validateObjectIdParam = require("../middlewares/objectId");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { addToCartSchema, updateCartSchema } = require("../validators/cart");

/* ─── ADMIN  */
cartRouter.get("/admin",authUser, authAdmin, adminController.getAdmin);
cartRouter.get("/admin/:id",authUser, authAdmin, validateObjectIdParam("id"), adminController.getByIdAdmin);
cartRouter.delete("/admin/:id",authUser, authAdmin, validateObjectIdParam("id"), adminController.remove);

/* ─── USER  */
cartRouter.get("/me", authUser, userController.getMyCart);

cartRouter.post(
  "/me/items",
  authUser,
  validate(addToCartSchema),
  userController.addToCart
);

cartRouter.delete(
  "/me/items/:offerId",
  authUser,
  validateObjectIdParam("offerId"),
  userController.removeFromCart
);

cartRouter.patch(
  "/me",
  authUser,
  validate(updateCartSchema),
  userController.updateCart
);

cartRouter.delete("/me", authUser, userController.clearMyCart);

module.exports = cartRouter;