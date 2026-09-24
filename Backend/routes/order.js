const express = require("express");

const orderRouter = express.Router();
const publicController = require("../controllers/public/order");
const userController = require("../controllers/user/order");
const sellerController = require("../controllers/seller/order");
const adminController = require("../controllers/admin/order");

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
    adminController.getAdmin);

// orders whose finalize never completed (server crash) + a way to finish them
orderRouter.get(
    "/admin/stuck",
    authUser,
    authAdmin,
    adminController.getStuckOrders
);

orderRouter.post(
    "/admin/auto-complete",
    authUser,
    authAdmin,
    adminController.runAutoComplete
);

orderRouter.post(
    "/admin/:id/delivered",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    adminController.markDelivered
);

orderRouter.post(
    "/admin/:id/repair",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    adminController.repairOrder
);

orderRouter.get(
    "/admin/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    adminController.getByIdAdmin
);

orderRouter.patch(
    "/admin/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validate(updateOrderAdminSchema),
    adminController.patchAdmin
);

orderRouter.patch(
    "/admin/:id/items/:itemId/ship",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(shipOrderSchema),
    adminController.adminShipItem
);

// USER ROUTES 
orderRouter.post(
    "/checkout",
    authUser,
    validate(checkoutSchema),
    userController.checkout
);
orderRouter.get(
    "/verify",
    publicController.verify
);

orderRouter.get("/my"
    ,authUser,
    userController.getMyOrders);

// SELLER — orders containing at least one of this seller's items.
orderRouter.get("/seller",
    authUser,
    authSeller,
    sellerController.getSeller);

orderRouter.patch("/seller/:id/items/:itemId/ship",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(shipOrderSchema),
    sellerController.sellerShipItem);

orderRouter.get(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.getMyOrderById
);
orderRouter.patch(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(updateOrderOwnerSchema),
    userController.patch
);
orderRouter.delete(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(cancelOrderSchema),
    userController.cancel
);

// Buyer confirms they received the order — the only way status becomes "completed".
orderRouter.patch(
    "/:id/confirm-delivery",
    authUser,
    validateObjectIdParam("id"),
    userController.confirmDelivery
);

module.exports = orderRouter;