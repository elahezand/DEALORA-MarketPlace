const express = require("express");
const newsLetterRouter = express.Router();

const controller = require("../controllers/newsletter");
const { authAdmin } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const createNewsletterSchema = require("../validators/newsLetter");

// GET all (admin)
newsLetterRouter.get(
  "/",
  authAdmin,
  controller.getAll
);

// POST subscribe (public)
newsLetterRouter.post(
  "/",
  validate(createNewsletterSchema),
  controller.post
);

module.exports = newsLetterRouter;