const Article = require("../../models/article");
const { paginate, escapeRegex } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getPublicArticles = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 15, 100);
  const filters = { isPublished: true };

  if (query.category) {
    filters.category = query.category;
  }

  if (query.q) {
    filters.$or = [
      { title: { $regex: new RegExp(escapeRegex(query.q), "i") } },
      { excerpt: { $regex: new RegExp(escapeRegex(query.q), "i") } },
    ];
  }

  return paginate(Article, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { createdAt: -1 },
    populate: { path: "category", select: "title slug" },
    select: "-content",
  });
};

const getPublicArticleById = async (id) => {
  const article = await Article.findOneAndUpdate(
    { _id: id, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("category", "title slug");

  if (!article) {
    throw new AppError(404, "Article not found");
  }

  return article;
};

module.exports = {
  getPublicArticles,
  getPublicArticleById,
};
