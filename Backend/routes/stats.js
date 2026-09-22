const express = require("express");
const statsRouter = express.Router();
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");

const publicController = require("../controllers/public/stats");
const userController = require("../controllers/user/stats");
const sellerController = require("../controllers/seller/stats");
const adminController = require("../controllers/admin/stats");
const cacheMiddleware = require("../middlewares/cache");

statsRouter.get("/", cacheMiddleware(300), publicController.getPublic);

/*  ADMIN ONLY  */
statsRouter.get("/admin",
    authUser,
    authAdmin,
    cacheMiddleware(60),
    adminController.getAdmin);

statsRouter.get("/admin/timeseries",
    authUser,
    authAdmin,
    cacheMiddleware(60),
    adminController.getAdminTimeseries);

/*  USER  */
statsRouter.get("/me/timeseries",
    authUser,
    cacheMiddleware(60),
    userController.getUserTimeseries);

/*Seller*/
statsRouter.get("/seller",
    authUser,
    authSeller,
    cacheMiddleware(60),
    sellerController.getSeller);

statsRouter.get("/seller/timeseries",
    authUser,
    authSeller,
    cacheMiddleware(60),
    sellerController.getSellerTimeseries);


module.exports = statsRouter;