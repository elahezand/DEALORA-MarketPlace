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
  createOffer,
  getAllOffers,
  getMyOffers,
  deleteOffer,
  approveOffer,
  updateOffer,
} = require("../controllers/offerSeller");

const {
  createOfferSchema,
  updateOfferSchema,
} = require("../validators/sellerOffer");

// CREATE OFFER (SELLER)
offerSellerRouter.post(
  "/",
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
  cacheMiddleware(120),
  getAllOffers
);

// GET MY OFFERS (SELLER)
offerSellerRouter.get(
  "/me",
  authUser,
  authSeller,
  cacheMiddleware(120),
  getMyOffers
);

// UPDATE OFFER (SELLER OWNER)
offerSellerRouter.patch(
  "/:offerId",
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
  approveOffer
);

// DELETE OFFER (SELLER OWNER OR ADMIN)
offerSellerRouter.delete(
  "/:offerId",
  authUser,
  authSeller,
  validateObjectIdParam("offerId"),
  deleteOffer
);

module.exports = offerSellerRouter;