const service = require("../services/category");
const invalidateCache = require("../utils/cache");
const AppError = require("../utils/AppError");

exports.get = async (req, res, next) => {
  try {
    const data = await service.getAllCategories();
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await service.getCategoryById(req.params.id);
    if (!data)
      return next(new AppError(404, "Category not found"));    
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.post = async (req, res, next) => {
  try {
    const category = await service.createCategory(req.parsed.data);

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

exports.put = async (req, res, next) => {
  try {
    const updated = await service.updateCategory(
      req.params.id,
      req.parsed.data
    );

    if (!updated) {
      return next(new AppError(404, "Category not found"));
    }
    await invalidateCache("/api/categories*");

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id);

    await invalidateCache("/api/categories*");

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (e) {
    next(e);
  }
};

