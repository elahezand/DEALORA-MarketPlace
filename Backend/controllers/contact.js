const service = require("../services/contact");

exports.get = async (req, res, next) => {
  try {
    const result = await service.getContacts(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const contact = await service.getContactById(req.params.id);

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (e) {
    next(e);
  }
};

exports.post = async (req, res, next) => {
  try {
    const contact = await service.createContact(req.parsed.data);

    res.status(201).json({
      success: true,
      message: "Contact sent",
      data: contact,
    });
  } catch (e) {
    next(e);
  }
};

exports.answer = async (req, res, next) => {
  try {
    const contact = await service.answerContact(
      req.params.id,
      req.user.id,
      req.parsed.data.content
    );

    res.status(200).json({
      success: true,
      message: "Answered successfully",
      data: contact,
    });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteContact(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    next(e);
  }
};