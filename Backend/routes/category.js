const express = require("express");
const categoryRouter = express.Router();

const publicController = require("../controllers/public/category");
const adminController = require("../controllers/admin/category");
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
    publicController.get
);

categoryRouter.get(
    "/slug/:slug",
    cacheMiddleware(300),
    publicController.getBySlug
);

categoryRouter.get(
    "/:id",
    validateObjectIdParam("id"),
    publicController.getOne
);

/*  ADMIN  */

categoryRouter.post(
    "/",
    authUser,
    authAdmin,
    validate(CategorySchema),
    adminController.post
);

categoryRouter.put(
    "/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    validate(UpdateCategorySchema),
    adminController.put
);

categoryRouter.delete(
    "/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    adminController.remove
);

module.exports = categoryRouter;