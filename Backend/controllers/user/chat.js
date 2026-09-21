const userChatService = require("../../services/user/chat");

const startConversation = async (req, res, next) => {
  try {
    const result = await userChatService.startConversation(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const message = await userChatService.sendMessage(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

const getMyConversations = async (req, res, next) => {
  try {
    const result = await userChatService.getMyConversations(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const result = await userChatService.getMessages(req.params.id, req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyConversations,
  startConversation,
  getMessages,
  sendMessage,
};
