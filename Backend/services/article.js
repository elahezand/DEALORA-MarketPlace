const Article = require("../models/article");
const { paginate, escapeRegex } = require("../utils/helper");
const AppError = require("../utils/AppError");

/* ─── PUBLIC ──────────────────────────────────────────────────────────── */

const getPublicArticles = async (query = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);

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

/* ─── ADMIN ───────────────────────────────────────────────────────────── */

const getAllArticlesAdmin = async (query = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  const filters = {};
  if (query.category) filters.category = query.category;
  if (query.isPublished !== undefined) {
    filters.isPublished = query.isPublished === "true";
  }

  return paginate(Article, {
    limit,
    cursor: query.cursor,
    filters,
    sort: { createdAt: -1 },
    populate: { path: "category", select: "title slug" },
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
  getPublicArticles,
  getPublicArticleById,
  getAllArticlesAdmin,
  getArticleByIdAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
};