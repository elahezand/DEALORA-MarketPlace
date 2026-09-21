const adminInfoService = require("../../services/admin/info");

const post = async (req, res, next) => {
  try {
    const info = await adminInfoService.createInfo(req.parsed.data);

    res.status(201).json({
      success: true,
      message: "Created",
      data: info,
    });
  } catch (e) {
    next(e);
  }
};

const patch = async (req, res, next) => {
  try {
    const info = await adminInfoService.updateInfo(req.parsed.data);

    res.status(200).json({
      success: true,
      message: "Updated",
      data: info,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await adminInfoService.deleteInfo();

    res.status(200).json({ success: true, message: "Deleted" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  post,
  patch,
  remove,
};
