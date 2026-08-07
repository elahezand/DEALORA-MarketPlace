const newsletterService = require("../services/newsLetter");

// GET ALL
exports.getAll = async (req, res, next) => {
  try {
    const searchParams = new URLSearchParams(req.query || {});
    const data = await newsletterService.getAll(searchParams);

    res.status(200).json(data);
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
      message: "Subscribed successfully",
      newsletter,
    });
  } catch (err) {
    next(err);
  }
};