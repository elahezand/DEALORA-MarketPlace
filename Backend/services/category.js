const Category = require("../models/category");
const AppError = require("../utils/AppError");

/*  tree builder  */
const buildTree = (items, parent = null) => {
    return items
        .filter((c) => String(c.parent || null) === String(parent))
        .map((c) => ({
            ...c,
            subCategories: buildTree(items, c._id),
        }));
};

const getAllCategories = async () => {
    const categories = await Category.find({}).lean();
    return buildTree(categories);
};

const withInheritedFilters = async (category) => {
    if (!category) return null;

    let allFilters = [...(category.filters || [])];
    let currentParentId = category.parent;

    while (currentParentId) {
        const parentCategory = await Category.findById(currentParentId).select('filters parent').lean();

        if (parentCategory) {
            if (parentCategory.filters && parentCategory.filters.length > 0) {
                allFilters = [...parentCategory.filters, ...allFilters];
            }
            currentParentId = parentCategory.parent;
        } else {
            break;
        }
    }

    const uniqueFilters = Array.from(
        new Map(allFilters.map(filter => [filter.slug, filter])).values()
    );
    return {
        ...category,
        filters: uniqueFilters
    };
};

const getCategoryById = async (id) => {
    const category = await Category.findById(id).lean();
    if (!category) return null;
    return withInheritedFilters(category);
};

/* Used for public, slug-based */
const getCategoryBySlug = async (slug) => {
    const category = await Category.findOne({ slug }).lean();
    if (!category) return null;
    return withInheritedFilters(category);
};
/* create */
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
        return await Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    } catch (e) {
        if (e.code === 11000) {
            throw new AppError(409, "A category with this slug already exists");
        }
        throw e;
    }
};

/*  delete */
const deleteCategoryRecursive = async (id) => {
    const children = await Category.find({ parent: id }).lean();

    for (const child of children) {
        await deleteCategoryRecursive(child._id);
    }
    await Category.findByIdAndDelete(id);
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory: deleteCategoryRecursive,
};