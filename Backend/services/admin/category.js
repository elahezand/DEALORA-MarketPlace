const Category = require("../../models/category");
const AppError = require("../../utils/AppError");

const createCategory = async (data) => {
    try {
        return await Category.create(data);
    } catch (e) {
        if (e.code === 11000) {
            throw new AppError(409, "Category already exists");
        }
        throw e;
    }
};

const updateCategory = async (id, data) => {
    try {
        return await Category.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after", runValidators: true });
    } catch (e) {
        if (e.code === 11000) {
            throw new AppError(409, "A category with this slug already exists");
        }
        throw e;
    }
};

const deleteCategoryRecursive = async (id) => {
    const children = await Category.find({ parent: id }).lean();

    for (const child of children) {
        await deleteCategoryRecursive(child._id);
    }
    await Category.findByIdAndDelete(id);
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory: deleteCategoryRecursive,
};
