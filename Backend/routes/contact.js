const express = require("express");
const contactRouter = express.Router();

const publicController = require("../controllers/public/contact");
const adminController = require("../controllers/admin/contact");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validateObjectId = require("../middlewares/objectId");
const validate = require("../middlewares/validate");

const { createContactSchema, answerContactSchema } = require("../validators/contact");
const rateLimit = require("express-rate-limit");

// LIMIT for spam protection
const contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many messages, try later." },
});

// PUBLIC (send message)
contactRouter.post(
  "/",
  contactLimit,
  validate(createContactSchema),
  publicController.post
);

// ADMIN (get all)
contactRouter.get(
  "/",
  authUser,
  authAdmin,
  adminController.get
);

// ADMIN (get one)
contactRouter.get(
  "/:id",
  authUser,
  authAdmin,
  validateObjectId("id"),
  adminController.getOne
);

// ADMIN (delete)
contactRouter.delete(
  "/:id",
  authUser,
  authAdmin,
  validateObjectId("id"),
  adminController.remove
);

// ADMIN (answer)
contactRouter.patch(
  "/:id/answer",
  authUser,
  authAdmin,
  validateObjectId("id"),
  validate(answerContactSchema),
  adminController.answer
);

module.exports = contactRouter;