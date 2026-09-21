const publicCategoryService = require("../../services/public/category");
const AppError = require("../../utils/AppError");

const get = async (req, res, next) => {
  try {
    const data = await publicCategoryService.getAllCategories();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await publicCategoryService.getCategoryById(req.params.id);
    if (!data)
      return next(new AppError(404, "Category not found"));
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/* Public: look a category up by its slug*/
const getBySlug = async (req, res, next) => {
  try {
    const data = await publicCategoryService.getCategoryBySlug(req.params.slug);
    if (!data)
      return next(new AppError(404, "Category not found"));
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  get,
  getBySlug,
  getOne,
};
