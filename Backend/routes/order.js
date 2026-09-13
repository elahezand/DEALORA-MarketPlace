const express = require("express");

const orderRouter = express.Router();
const controller = require("../controllers/order");

const validateObjectIdParam = require("../middlewares/objectId");
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const {
    checkoutSchema,
    updateOrderAdminSchema,
    updateOrderOwnerSchema,
    cancelOrderSchema,
    shipOrderSchema,
} = require("../validators/order");


// ADMIN ROUTES 
orderRouter.get("/admin",
    authUser,
    authAdmin,
    controller.getAdmin);

orderRouter.get(
    "/admin/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.getByIdAdmin
);

orderRouter.patch(
    "/admin/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validate(updateOrderAdminSchema),
    controller.patchAdmin
);

orderRouter.patch(
    "/admin/:id/items/:itemId/ship",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(shipOrderSchema),
    controller.adminShipItem
);

// USER ROUTES 
orderRouter.post(
    "/checkout",
    authUser,
    validate(checkoutSchema),
    controller.checkout
);
orderRouter.get(
    "/verify",
    controller.verify
);

orderRouter.get("/my"
    ,authUser,
    controller.getMyOrders);

// SELLER — orders containing at least one of this seller's items.
orderRouter.get("/seller",
    authUser,
    authSeller,
    controller.getSeller);

orderRouter.patch("/seller/:id/items/:itemId/ship",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(shipOrderSchema),
    controller.sellerShipItem);

orderRouter.get(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.getMyOrderById
);
orderRouter.patch(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(updateOrderOwnerSchema),
    controller.patch
);
orderRouter.delete(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(cancelOrderSchema),
    controller.cancel
);

// Buyer confirms they received the order — the only way status becomes "completed".
orderRouter.patch(
    "/:id/confirm-delivery",
    authUser,
    validateObjectIdParam("id"),
    controller.confirmDelivery
);

module.exports = orderRouter;