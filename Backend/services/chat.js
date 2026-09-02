const mongoose = require("mongoose");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

const isValidId = mongoose.Types.ObjectId.isValid;

/* === start a new conversation, or reuse existing one for the same listing === */
const startConversation = async (senderId, data) => {
  if (!isValidId(data.recipientId)) {
    throw new AppError(400, "Invalid recipientId");
  }
  if (String(senderId) === String(data.recipientId)) {
    throw new AppError(400, "You cannot start a conversation with yourself");
  }
  if (data.listingId && !isValidId(data.listingId)) {
    throw new AppError(400, "Invalid listingId");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, data.recipientId] },
    listing: data.listingId || null,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, data.recipientId],
      listing: data.listingId || null,
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    body: data.message,
  });

  conversation.lastMessage = {
    body: data.message,
    sender: senderId,
    sentAt: message.createdAt,
  };
  const currentUnread = conversation.unreadCount.get(String(data.recipientId)) || 0;
  conversation.unreadCount.set(String(data.recipientId), currentUnread + 1);
  await conversation.save();

  return { conversation, message };
};

/* === send a message inside an existing conversation === */
const sendMessage = async (conversationId, senderId, data) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(senderId)
  );
  if (!isParticipant) throw new AppError(403, "Access denied");
  if (conversation.isBlocked) throw new AppError(403, "This conversation is blocked");

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    body: data.body,
    attachments: data.attachments || [],
  });

  const recipientId = conversation.participants.find(
    (p) => String(p) !== String(senderId)
  );

  conversation.lastMessage = {
    body: data.body,
    sender: senderId,
    sentAt: message.createdAt,
  };
  const currentUnread = conversation.unreadCount.get(String(recipientId)) || 0;
  conversation.unreadCount.set(String(recipientId), currentUnread + 1);
  await conversation.save();

  return message;
};

/* === list conversations for the logged-in user === */
const getMyConversations = async (userId, query = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  return paginate(Conversation, {
    limit,
    cursor: query.cursor,
    filters: { participants: userId },
    sort: { updatedAt: -1 },
    cursorField: "updatedAt",
    populate: [
      { path: "participants", select: "username phone profilePicture" },
      { path: "listing", select: "title images price" },
    ],
  });
};

/* === get messages of one conversation (and mark as read) === */
const getMessages = async (conversationId, userId, query = {}) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(userId)
  );
  if (!isParticipant) throw new AppError(403, "Access denied");

  const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
  const result = await paginate(Message, {
    limit,
    cursor: query.cursor,
    filters: { conversation: conversationId, deletedAt: null },
  });

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readAt: null },
    { $set: { readAt: new Date() } }
  );
  conversation.unreadCount.set(String(userId), 0);
  await conversation.save();

  return result;
};

module.exports = {
  startConversation,
  sendMessage,
  getMyConversations,
  getMessages,
};
