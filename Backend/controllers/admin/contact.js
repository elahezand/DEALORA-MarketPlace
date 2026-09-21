const adminContactService = require("../../services/admin/contact");

const get = async (req, res, next) => {
  try {
    const result = await adminContactService.getContacts(req.query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

const getOne = async (req, res, next) => {
  try {
    const contact = await adminContactService.getContactById(req.params.id);

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (e) {
    next(e);
  }
};

const answer = async (req, res, next) => {
  try {
    const contact = await adminContactService.answerContact(
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

const remove = async (req, res, next) => {
  try {
    await adminContactService.deleteContact(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  get,
  getOne,
  remove,
  answer,
};
