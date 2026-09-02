const express = require("express");
const contactRouter = express.Router();

const controller = require("../controllers/contact");
const { authAdmin,authUser } = require("../middlewares/authMiddleware");
const validateObjectId = require("../middlewares/objectId");
const validate = require("../middlewares/validate");

const { createContactSchema } = require("../validators/contact");
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
  controller.post
);

// ADMIN (get all)
contactRouter.get(
  "/",
  authUser,
  authAdmin,
  controller.get
);

// ADMIN (get one)
contactRouter.get(
  "/:id",
  authUser,
  authAdmin,
  validateObjectId("id"),
  controller.getOne
);

// ADMIN (delete)
contactRouter.delete(
  "/:id",
  authUser,
  authAdmin,
  validateObjectId("id"),
  controller.remove
);

// ADMIN (answer)
contactRouter.patch(
  "/:id/answer",
  authUser,
  authAdmin,
  validateObjectId("id"),
  controller.answer
);

module.exports = contactRouter;