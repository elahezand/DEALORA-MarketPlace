const express = require("express");
const newsLetterRouter = express.Router();

const publicController = require("../controllers/public/newsletter");
const adminController = require("../controllers/admin/newsletter");
const { authAdmin ,authUser} = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const createNewsletterSchema = require("../validators/newsLetter");

// ADMIN
newsLetterRouter.get(
  "/",
  authUser,
  authAdmin,
  adminController.getAll
);

//PUBLIC
newsLetterRouter.post(
  "/",
  validate(createNewsletterSchema),
  publicController.post
);

module.exports = newsLetterRouter;