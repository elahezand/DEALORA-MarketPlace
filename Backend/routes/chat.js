const express = require("express");
const router = express.Router();
const controller = require("../controllers/chat");
const { authUser } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { startConversationSchema, sendMessageSchema } = require("../validators/chat");

router.get("/conversations", authUser, controller.getMyConversations);
router.post("/conversations", authUser, validate(startConversationSchema), controller.startConversation);

router.get(
  "/conversations/:id/messages",
  authUser,
  validateObjectIdParam("id"),
  controller.getMessages
);
router.post(
  "/conversations/:id/messages",
  authUser,
  validateObjectIdParam("id"),
  validate(sendMessageSchema),
  controller.sendMessage
);

module.exports = router;
