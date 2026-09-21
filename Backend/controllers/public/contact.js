const publicContactService = require("../../services/public/contact");

const post = async (req, res, next) => {
  try {
    const contact = await publicContactService.createContact(req.parsed.data);

    res.status(201).json({
      success: true,
      message: "Contact sent",
      data: contact,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  post,
};
