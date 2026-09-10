const express = require("express");
const statsRouter = express.Router();
const { authUser, authAdmin, authSeller } = require("../middlewares/authMiddleware");

const controller = require("../controllers/stats");
const cacheMiddleware = require("../middlewares/cache");

statsRouter.get("/", cacheMiddleware(300), controller.getPublic);

/*  ADMIN ONLY  */
statsRouter.get("/admin",
    authUser,
    authAdmin,
    cacheMiddleware(60),
    controller.getAdmin);

statsRouter.get("/admin/timeseries",
    authUser,
    authAdmin,
    cacheMiddleware(60),
    controller.getAdminTimeseries);

/*  USER  */
statsRouter.get("/me/timeseries",
    authUser,
    cacheMiddleware(60),
    controller.getUserTimeseries);

/*Seller*/
statsRouter.get("/seller",
    authUser,
    authSeller,
    cacheMiddleware(60),
    controller.getSeller);

statsRouter.get("/seller/timeseries",
    authUser,
    authSeller,
    cacheMiddleware(60),
    controller.getSellerTimeseries);


module.exports = statsRouter;