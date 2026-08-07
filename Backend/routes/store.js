const express = require("express");
const storeRouter = express.Router();
const controller = require("../controllers/store");
const { authUser, authSeller, authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate")
const validateObjectIdParam = require("../middlewares/objectId")
const { storeSchema, storeUpdateSchema } = require("../validators/seller")


storeRouter.get("/",
    authUser,
    authAdmin,
    controller.getAll);

storeRouter.get("/:id",
    authUser,
    authSeller,
    controller.get);

storeRouter.post("/",
    authUser,
    validate(storeSchema),
    controller.create);

storeRouter.patch("/:id",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    validate(storeUpdateSchema),
    controller.updateStore);

storeRouter.delete("/:id",
    authUser,
    authSeller,
    validateObjectIdParam("id"),
    controller.deleteStore)

/* ADMIN */
storeRouter.patch("/:id/verify",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.verifyStore);

module.exports = storeRouter;
