const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/chat");
const { authUser } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const validateObjectIdParam = require("../middlewares/objectId");
const { startConversationSchema, sendMessageSchema } = require("../validators/chat");

router.get("/conversations", authUser, userController.getMyConversations);
router.post("/conversations", authUser, validate(startConversationSchema), userController.startConversation);

router.get(
  "/conversations/:id/messages",
  authUser,
  validateObjectIdParam("id"),
  userController.getMessages
);
router.post(
  "/conversations/:id/messages",
  authUser,
  validateObjectIdParam("id"),
  validate(sendMessageSchema),
  userController.sendMessage
);

module.exports = router;
