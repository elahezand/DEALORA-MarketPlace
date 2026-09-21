const publicInfoService = require("../../services/public/info");

const get = async (req, res, next) => {
  try {
    const info = await publicInfoService.getInfo();
    res.status(200).json({ success: true, data: info });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  get,
};
