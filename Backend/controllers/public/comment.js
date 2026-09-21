const publicCommentService = require("../../services/public/comment");

const getByListing = async (req, res, next) => {
  try {
    const result = await publicCommentService.getByProduct(req.params.listing, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getByListing,
};
