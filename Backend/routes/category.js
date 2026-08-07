const express = require("express");
const categoryRouter = express.Router();

const controller = require("../controllers/category");
const cacheMiddleware = require("../middlewares/cache");

const { authAdmin } = require("../middlewares/authMiddleware");
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
    authAdmin,
    validate(CategorySchema),
    controller.post
);

categoryRouter.put(
    "/:id",
    authAdmin,
    validateObjectIdParam("id"),
    validate(UpdateCategorySchema),
    controller.put
);

categoryRouter.delete(
    "/:id",
    authAdmin,
    validateObjectIdParam("id"),
    controller.remove
);

module.exports = categoryRouter;