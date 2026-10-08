const express = require("express");
const offerSellerRouter = express.Router();

const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");

const {
  authUser,
  authSeller,
  authAdmin,
} = require("../middlewares/authMiddleware");

const {
  getOfferableProducts,
  createOffer,
  getMyOffers,
  deleteOffer,
  updateOffer,
} = require("../controllers/seller/offerSeller");
const {
  getAllOffers,
  approveOffer,
  deleteOffer: adminDeleteOffer,
} = require("../controllers/admin/offerSeller");

const {
  createOfferSchema,
  updateOfferSchema,
  approveOfferSchema,
} = require("../validators/sellerOffer");

// (ADMIN)
offerSellerRouter.get(
  "/",
  authUser,
  authAdmin,
  getAllOffers
);
offerSellerRouter.patch(
  "/:offerId/approve",
  authUser,
  authAdmin,
  validateObjectIdParam("offerId"),
  validate(approveOfferSchema),
  approveOffer
);
offerSellerRouter.delete(
  "/admin/:offerId",
  authUser,
  authAdmin,
  validateObjectIdParam("offerId"),
  adminDeleteOffer
);

// (SELLER)
offerSellerRouter.get(
  "/me",
  authUser,
  authSeller,
  getMyOffers
);
offerSellerRouter.post(
  "/me",
  authUser,
  authSeller,
  validate(createOfferSchema),
  createOffer
);

offerSellerRouter.patch(
  "/me/:offerId",
  authUser,
  authSeller,
  validateObjectIdParam("offerId"),
  validate(updateOfferSchema),
  updateOffer
);
/*PRODUCTS THE SELLER CAN OFFER ON (SELLER) — only its store's category*/
offerSellerRouter.get(
  "/products",
  authUser,
  authSeller,
  getOfferableProducts
);

offerSellerRouter.delete(
  "/me/:offerId",
  authUser,
  authSeller,
  validateObjectIdParam("offerId"),
  deleteOffer
);


module.exports = offerSellerRouter;