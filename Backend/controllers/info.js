const service = require("../services/info");

exports.get = async (req, res, next) => {
  try {
    const info = await service.getInfo();
    res.status(200).json({ success: true, data: info });
  } catch (e) {
    next(e);
  }
};

exports.post = async (req, res, next) => {
  try {
    const info = await service.createInfo(req.parsed.data);

    res.status(201).json({
      success: true,
      message: "Created",
      data: info,
    });
  } catch (e) {
    next(e);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const info = await service.updateInfo(req.parsed.data);

    res.status(200).json({
      success: true,
      message: "Updated",
      data: info,
    });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteInfo();

    res.status(200).json({ success: true, message: "Deleted" });
  } catch (e) {
    next(e);
  }
};
