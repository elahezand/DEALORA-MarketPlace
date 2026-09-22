const express = require("express");
const storeRouter = express.Router();
const publicController = require("../controllers/public/store");
const userController = require("../controllers/user/store");
const sellerController = require("../controllers/seller/store");
const adminController = require("../controllers/admin/store");
const { authUser, authSeller, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate")
const validateObjectIdParam = require("../middlewares/objectId")
const { storeSchema, storeUpdateSchema } = require("../validators/seller")
const cacheMiddleware = require("../middlewares/cache");

/*  PUBLIC  */
storeRouter.get("/verified",
    cacheMiddleware(300),
    publicController.getVerified);

storeRouter.get("/slug/:slug",
    cacheMiddleware(300),
    publicController.getBySlug);

storeRouter.get("/",
    authUser,
    authAdmin,
    adminController.getAll);

storeRouter.get("/:id",
    authUser,
    authSeller,
    sellerController.get);

storeRouter.post("/",
    authUser,
    validate(storeSchema),
    userController.create);

storeRouter.patch("/:id",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validate(storeUpdateSchema),
    sellerController.updateStore);

storeRouter.delete("/:id",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    sellerController.deleteStore)

/* ADMIN */
storeRouter.patch("/:id/verify",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    adminController.verifyStore);

module.exports = storeRouter;