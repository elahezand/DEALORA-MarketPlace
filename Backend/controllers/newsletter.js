const newsletterService = require("../services/newsLetter");

// GET ALL
exports.getAll = async (req, res, next) => {
  try {
    const searchParams = new URLSearchParams(req.query || {});
    const result = await newsletterService.getAll(searchParams);

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST SUBSCRIBE
exports.post = async (req, res, next) => {
  try {
    const { email } = req.parsed.data;
    const newsletter = await newsletterService.subscribe(email);

    res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      data: newsletter,
    });
  } catch (err) {
    next(err);
  }
};
