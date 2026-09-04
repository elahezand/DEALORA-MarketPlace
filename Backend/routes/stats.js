const express = require("express");
const statsRouter = express.Router();
const { authUser, authAdmin } = require("../middlewares/authMiddleware");

const controller = require("../controllers/stats");
const cacheMiddleware = require("../middlewares/cache");

statsRouter.get("/", cacheMiddleware(300), controller.getPublic);

/*  ADMIN ONLY  */
statsRouter.get("/admin",
    authUser,
    authAdmin,
    cacheMiddleware(60),
    controller.getAdmin);

module.exports = statsRouter;