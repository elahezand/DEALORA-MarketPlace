const express = require("express");

const orderRouter = express.Router();
const controller = require("../controllers/order");

const validateObjectIdParam = require("../middlewares/objectId");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const {
    checkoutSchema,
    updateOrderAdminSchema,
    updateOrderOwnerSchema,
    cancelOrderSchema,
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

module.exports = orderRouter;