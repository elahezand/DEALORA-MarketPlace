const service = require("../services/article");

/* ─── PUBLIC ──────────────────────────────────────────────────────────── */

exports.getAll = async (req, res, next) => {
  try {
    const result = await service.getPublicArticles(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const article = await service.getPublicArticleById(req.params.id);
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

/* ─── ADMIN ───────────────────────────────────────────────────────────── */

exports.getAllAdmin = async (req, res, next) => {
  try {
    const result = await service.getAllArticlesAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getOneAdmin = async (req, res, next) => {
  try {
    const article = await service.getArticleByIdAdmin(req.params.id);
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const article = await service.createArticle(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, message: "Article created", data: article });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const article = await service.updateArticle(req.params.id, req.parsed.data);
    res.status(200).json({ success: true, message: "Article updated", data: article });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteArticle(req.params.id);
    res.status(200).json({ success: true, message: "Article deleted" });
  } catch (err) {
    next(err);
  }
};
