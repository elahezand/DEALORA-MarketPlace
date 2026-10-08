const express = require("express");
const listingRouter = express.Router();

const Listing = require("../models/listing");

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
const rateLimit = require("express-rate-limit");

const smartSearchLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI searches, try again in a few minutes." },
});

listingRouter.post("/smart-search", smartSearchLimit, publicController.handleSmartSearch);
listingRouter.get("/my", authUser, userController.getMyListings);

//ADMIN 
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

listingRouter.patch(
  "/:id/status",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(updateStatusSchema),
  adminController.changeStatus
);


// USER
listingRouter.post(
  "/",
  authUser,
  upload.array("pics", 10),
  upload.verifyUploadedImages,
  validate(createListingSchema),
  userController.createListing
);

listingRouter.get(
  "/:id/preview",
  authUser,
  validateObjectIdParam("id"),
  userController.getPreview
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


// Public: only accepted ads / active store products
/*count views before cache*/
const countView = (req, res, next) => {
  Listing.updateOne(
    {
      _id: req.params.id,
      $or: [
        { listingType: "user_ad", status: "accepted" },
        { listingType: "store_product", status: "active" },
      ],
    },
    { $inc: { "metrics.views": 1 } }
  ).catch(() => { });
  next();
};

listingRouter.get(
  "/:id",
  validateObjectIdParam("id"),
  countView,
  cacheMiddleware(300),
  publicController.getOne
);

module.exports = listingRouter;