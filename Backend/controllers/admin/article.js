const adminArticleService = require("../../services/admin/article");

const getAllAdmin = async (req, res, next) => {
  try {
    const result = await adminArticleService.getAllArticlesAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOneAdmin = async (req, res, next) => {
  try {
    const article = await adminArticleService.getArticleByIdAdmin(req.params.id);
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const article = await adminArticleService.createArticle(req.user._id, req.parsed.data);
    res.status(201).json({ success: true, message: "Article created", data: article });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const article = await adminArticleService.updateArticle(req.params.id, req.parsed.data);
    res.status(200).json({ success: true, message: "Article updated", data: article });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await adminArticleService.deleteArticle(req.params.id);
    res.status(200).json({ success: true, message: "Article deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllAdmin,
  getOneAdmin,
  create,
  update,
  remove,
};
