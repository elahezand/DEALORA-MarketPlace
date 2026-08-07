const Category = require("../models/category");
const { all } = require("../routes/category");

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

const getCategoryById = async (id) => {
    const category = await Category.findById(id).lean();
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
/* create */
const createCategory = async (data) => {
    try {
        return await Category.create(data);
    } catch (e) {
        if (e.code === 11000) {
            throw { status: 409, message: "Category already exists" };
        }
        throw e;
    }
};

const updateCategory = async (id, data) => {
    return Category.findByIdAndUpdate(id, { $set: data }, { new: true });
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
    createCategory,
    updateCategory,
    deleteCategory: deleteCategoryRecursive,
};