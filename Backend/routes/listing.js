const express = require("express");
const listingRouter = express.Router();

const publicController = require("../controllers/public/listing");
const userController = require("../controllers/user/listing");
const adminController = require("../controllers/admin/listing");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");

const upload = require("../utils/multer");
const parseJsonBody = require("../middlewares/parseJsonBody");

const {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
} = require("../validators/listing");


listingRouter.get("/", cacheMiddleware(120), publicController.getAll);
listingRouter.post("/smart-search", publicController.handleSmartSearch);
listingRouter.get("/my", authUser, userController.getMyListings);

/* ADMIN — must come before "/:id" */
listingRouter.get(
  "/admin",
  authUser,
  authAdmin,
  adminController.getAllAdmin
);

listingRouter.get(
  "/admin/:id/preview",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  adminController.getPreview
);

listingRouter.post(
  "/admin",
  authUser,
  authAdmin,
  upload.array("pics", 10),
  upload.verifyUploadedImages,
  parseJsonBody,
  validate(createListingSchema),
  adminController.createStoreProduct
);

listingRouter.put(
  "/admin/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  upload.array("pics", 10),
  upload.verifyUploadedImages,
  parseJsonBody,
  validate(updateListingSchema),
  adminController.updateListing
);

listingRouter.delete(
  "/admin/:id",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  adminController.deleteListing
);

// Owner preview of any status — never cached (it's per user)
listingRouter.get(
  "/:id/preview",
  authUser,
  validateObjectIdParam("id"),
  userController.getPreview
);

// Public: only accepted ads / active store products
listingRouter.get(
  "/:id",
  validateObjectIdParam("id"),
  cacheMiddleware(300),
  publicController.getOne
);

listingRouter.post(
  "/",
  authUser,
  upload.array("pics", 10),
  upload.verifyUploadedImages,
  validate(createListingSchema),
  userController.createListing
);

listingRouter.put(
  "/:id",
  authUser,
  validateObjectIdParam("id"),
  upload.array("pics", 10),
  upload.verifyUploadedImages,
  validate(updateListingSchema),
  userController.updateListing
);

listingRouter.delete(
  "/:id",
  authUser,
  validateObjectIdParam("id"),
  userController.deleteListing
);

listingRouter.patch(
  "/:id/status",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(updateStatusSchema),
  adminController.changeStatus
);

module.exports = listingRouter;