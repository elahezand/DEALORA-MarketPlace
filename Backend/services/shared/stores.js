const Category = require("../../models/category");
const AppError = require("../../utils/AppError");

// a store sells in one top-level category (a category without a parent)
const assertTopLevelCategory = async (categoryId) => {
  const category = await Category.findById(categoryId).select("parent").lean();
  if (!category) throw new AppError(404, "Category not found");
  if (category.parent) throw new AppError(400, "Choose a main category (one without a parent)");
};

module.exports = { assertTopLevelCategory };
