const publicNewsLetterService = require("../../services/public/newsLetter");

const post = async (req, res, next) => {
  try {
    const { email } = req.parsed.data;
    const newsletter = await publicNewsLetterService.subscribe(email);

    res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      data: newsletter,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  post,
};
