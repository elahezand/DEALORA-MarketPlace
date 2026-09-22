const express = require("express");
const offerSellerRouter = express.Router();

const validate = require("../middlewares/validate");
const cacheMiddleware = require("../middlewares/cache");
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

// PRODUCTS THE SELLER CAN OFFER ON (SELLER) — only its store's category
offerSellerRouter.get(
  "/products",
  authUser,
  authSeller,
  getOfferableProducts
);

// CREATE OFFER (SELLER)
offerSellerRouter.post(
  "/me",
  authUser,
  authSeller,
  validate(createOfferSchema),
  createOffer
);

// GET ALL OFFERS (ADMIN)
offerSellerRouter.get(
  "/",
  authUser,
  authAdmin,
  getAllOffers
);

// GET MY OFFERS (SELLER)
offerSellerRouter.get(
  "/me",
  authUser,
  authSeller,
  getMyOffers
);

// UPDATE OFFER (SELLER OWNER)
offerSellerRouter.patch(
  "/me/:offerId",
  authUser,
  authSeller,
  validateObjectIdParam("offerId"),
  validate(updateOfferSchema),
  updateOffer
);

// APPROVE OFFER (ADMIN)
offerSellerRouter.patch(
  "/:offerId/approve",
  authUser,
  authAdmin,
  validateObjectIdParam("offerId"),
  validate(approveOfferSchema),
  approveOffer
);

// DELETE OFFER (SELLER — own pending offer)
offerSellerRouter.delete(
  "/me/:offerId",
  authUser,
  authSeller,
  validateObjectIdParam("offerId"),
  deleteOffer
);

// DELETE OFFER (ADMIN — any offer)
offerSellerRouter.delete(
  "/admin/:offerId",
  authUser,
  authAdmin,
  validateObjectIdParam("offerId"),
  adminDeleteOffer
);

module.exports = offerSellerRouter;