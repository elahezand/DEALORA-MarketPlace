const publicArticleService = require("../../services/public/article");


const getAll = async (req, res, next) => {
  try {
    const result = await publicArticleService.getPublicArticles(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const article = await publicArticleService.getPublicArticleById(req.params.id);
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
};
