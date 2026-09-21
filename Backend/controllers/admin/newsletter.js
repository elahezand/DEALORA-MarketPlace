const adminNewsLetterService = require("../../services/admin/newsLetter");

const getAll = async (req, res, next) => {
  try {
    const searchParams = new URLSearchParams(req.query || {});
    const result = await adminNewsLetterService.getAll(searchParams);

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
};
