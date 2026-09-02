const express = require("express");
const categoryRouter = express.Router();

const controller = require("../controllers/category");
const cacheMiddleware = require("../middlewares/cache");

const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");

const {
    CategorySchema,
    UpdateCategorySchema,
} = require("../validators/category");

/*  PUBLIC  */
categoryRouter.get(
    "/",
    cacheMiddleware(300),
    controller.get
);

categoryRouter.get(
    "/:id",
    validateObjectIdParam("id"),
    controller.getOne
);

/*  ADMIN  */

categoryRouter.post(
    "/",
    authUser,
    authAdmin,
    validate(CategorySchema),
    controller.post
);

categoryRouter.put(
    "/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validate(UpdateCategorySchema),
    controller.put
);

categoryRouter.delete(
    "/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.remove
);

module.exports = categoryRouter;