const chatService = require("../services/chat");

exports.startConversation = async (req, res, next) => {
  try {
    const result = await chatService.startConversation(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessage(
      req.params.id,
      req.user._id,
      req.parsed.data
    );
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

exports.getMyConversations = async (req, res, next) => {
  try {
    const result = await chatService.getMyConversations(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const result = await chatService.getMessages(req.params.id, req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
