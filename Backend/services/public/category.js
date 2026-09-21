const Category = require("../../models/category");

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

const getCategoryBySlug = async (slug) => {
    const category = await Category.findOne({ slug }).lean();
    if (!category) return null;
    return withInheritedFilters(category);
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
};
