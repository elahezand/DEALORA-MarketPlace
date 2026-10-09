const express = require("express");

const orderRouter = express.Router();
const publicController = require("../controllers/public/order");
const userController = require("../controllers/user/order");
const sellerController = require("../controllers/seller/order");
const adminController = require("../controllers/admin/order");

const validateObjectIdParam = require("../middlewares/objectId");
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const AppError = require("../utils/AppError");

const {
    checkoutSchema,
    updateOrderAdminSchema,
    cancelOrderSchema,
    shipOrderSchema,
    deliveryEstimateSchema,
    cashNotReceivedSchema,
    confirmDeliverySchema,
} = require("../validators/order");

// a store id, or "site" for the site's own items
const validateGroupParam = (req, res, next) =>
    /^([a-f0-9]{24}|site)$/.test(req.params.group) ? next() : next(new AppError(400, "Invalid group"));


// ADMIN ROUTES 
orderRouter.get("/admin",
    authUser,
    authAdmin,
    adminController.getAdmin);

orderRouter.post(
    "/admin/auto-complete",
    authUser,
    authAdmin,
    adminController.runAutoComplete
);

// cash received (site items)
orderRouter.patch(
    "/admin/:id/items/:itemId/cash-received",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    adminController.adminConfirmCash
);

// cash not received (site items)
orderRouter.patch(
    "/admin/:id/items/:itemId/cash-not-received",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(cashNotReceivedSchema),
    adminController.adminReportCashMissing
);

// cancel one store's part of the order
orderRouter.patch(
    "/admin/:id/groups/:group/cancel",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateGroupParam,
    adminController.adminCancelGroup
);

// cancel one item of the order
orderRouter.patch(
    "/admin/:id/items/:itemId/cancel",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    adminController.adminCancelItem
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

// change delivery time
orderRouter.patch(
    "/admin/:id/items/:itemId/delivery-estimate",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(deliveryEstimateSchema),
    adminController.adminSetDeliveryEstimate
);

// USER  
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
    , authUser,
    userController.getMyOrders);

// SELLER
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

// cash received
orderRouter.patch("/seller/:id/cash-received",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    sellerController.sellerConfirmCash);

// cash not received
orderRouter.patch("/seller/:id/cash-not-received",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validate(cashNotReceivedSchema),
    sellerController.sellerReportCashMissing);

orderRouter.patch("/seller/:id/items/:itemId/delivery-estimate",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(deliveryEstimateSchema),
    sellerController.sellerSetDeliveryEstimate);

// buyer confirms delivery (one store's part, or everything shipped)
orderRouter.patch(
    "/:id/confirm-delivery",
    authUser,
    validateObjectIdParam("id"),
    validate(confirmDeliverySchema),
    userController.confirmDelivery
);

// buyer cancels one item that hasn't been shipped yet
orderRouter.patch(
    "/:id/items/:itemId/cancel",
    authUser,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    userController.cancelItem
);

orderRouter.get(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.getMyOrderById
);
orderRouter.delete(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(cancelOrderSchema),
    userController.cancel
);

module.exports = orderRouter;