const adminCategoryService = require("../../services/admin/category");
const invalidateCache = require("../../utils/cache");
const AppError = require("../../utils/AppError");

const post = async (req, res, next) => {
  try {
    const category = await adminCategoryService.createCategory(req.parsed.data);

    await invalidateCache("/api/categories*");

    res.status(201).json({
      success: true,
      message: "Category created",
      data: category,
    });
  } catch (e) {
    next(e);
  }
};

const put = async (req, res, next) => {
  try {
    const category = await adminCategoryService.updateCategory(
      req.params.id,
      req.parsed.data
    );

    if (!category) {
      return next(new AppError(404, "Category not found"));
    }
    await invalidateCache("/api/categories*");

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: category,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await adminCategoryService.deleteCategory(req.params.id);

    await invalidateCache("/api/categories*");

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  post,
  put,
  remove,
};
