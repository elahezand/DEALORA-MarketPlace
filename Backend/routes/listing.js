const express = require("express");
const listingRouter = express.Router();

const controller = require("../controllers/listing");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");
const upload = require("../utils/multer");

const {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
} = require("../validators/listing");


listingRouter.get("/", cacheMiddleware(120), controller.getAll);
listingRouter.post("/smart-search", controller.handleSmartSearch);

listingRouter.get("/my", authUser, controller.getMyListings);


listingRouter.get(
  "/:id",
  validateObjectIdParam("id"),
  cacheMiddleware(300),
  controller.getOne
);

listingRouter.post(
  "/",
  authUser,
  upload.array("pics", 10), 
  validate(createListingSchema),
  controller.createListing
);

listingRouter.put(
  "/:id",
  authUser,
  validateObjectIdParam("id"),
  upload.array("pics", 10),
  validate(updateListingSchema),
  controller.updateListing
);

listingRouter.delete(
  "/:id",
  authUser,
  validateObjectIdParam("id"),
  controller.deleteListing
);

/* =========================================================
   3. ADMIN ROUTES
   ========================================================= */

listingRouter.patch(
  "/:id/status",
  authUser,
  authAdmin,
  validateObjectIdParam("id"),
  validate(updateStatusSchema),
  controller.changeStatus
);

module.exports = listingRouter;