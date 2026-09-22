const Article = require("../../models/article");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");

const getAllArticlesAdmin = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 15, 100);

  const filters = {};
  if (query.category) filters.category = query.category;
  if (query.isPublished !== undefined) {
    filters.isPublished = query.isPublished === "true";
  }

  return paginate(Article, {
    limit,
    cursor: query.cursor,
    filters,
    populate: { path: "category", select: "title slug" },
    sort: { createdAt: -1 },
  });
};

const getArticleByIdAdmin = async (id) => {
  const article = await Article.findById(id).populate("category", "title slug");
  if (!article) throw new AppError(404, "Article not found");
  return article;
};

const createArticle = async (authorId, data) => {
  const existing = await Article.findOne({ slug: data.slug });
  if (existing) throw new AppError(409, "An article with this slug already exists");

  try {
    return await Article.create({ ...data, author: authorId });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "An article with this slug already exists");
    }
    throw err;
  }
};

const updateArticle = async (id, data) => {
  if (data.slug) {
    const existing = await Article.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existing) throw new AppError(409, "An article with this slug already exists");
  }

  try {
    const article = await Article.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!article) throw new AppError(404, "Article not found");
    return article;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "An article with this slug already exists");
    }
    throw err;
  }
};

const deleteArticle = async (id) => {
  const article = await Article.findByIdAndDelete(id);
  if (!article) throw new AppError(404, "Article not found");
  return true;
};

module.exports = {
  getAllArticlesAdmin,
  getArticleByIdAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
};
