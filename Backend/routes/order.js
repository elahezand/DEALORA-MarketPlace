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
    deliveryEstimateSchema,
    cashNotReceivedSchema,
} = require("../validators/order");


// ADMIN  
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

/*cash received (site items)*/
orderRouter.patch(
    "/admin/:id/items/:itemId/cash-received",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    adminController.adminConfirmCash
);

/*cash not received (site items)*/
orderRouter.patch(
    "/admin/:id/items/:itemId/cash-not-received",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(cashNotReceivedSchema),
    adminController.adminReportCashMissing
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

/*change delivery time(site)*/
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

/* buyer confirms delivery*/
orderRouter.patch(
    "/:id/confirm-delivery",
    authUser,
    validateObjectIdParam("id"),
    userController.confirmDelivery
);

orderRouter.get(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.getMyOrderById
);

/*update address*/
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

/* cash received*/
orderRouter.patch("/seller/:id/cash-received",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    sellerController.sellerConfirmCash);

/*cash not received*/
orderRouter.patch("/seller/:id/cash-not-received",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validate(cashNotReceivedSchema),
    sellerController.sellerReportCashMissing);

/* change delivery time*/
orderRouter.patch("/seller/:id/items/:itemId/delivery-estimate",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validateObjectIdParam("itemId"),
    validate(deliveryEstimateSchema),
    sellerController.sellerSetDeliveryEstimate);




module.exports = orderRouter;