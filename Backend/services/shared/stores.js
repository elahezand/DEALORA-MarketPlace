const Category = require("../../models/category");
const Store = require("../../models/store");
const AppError = require("../../utils/AppError");

// a store sells in one top-level category (a category without a parent)
const assertTopLevelCategory = async (categoryId) => {
  const category = await Category.findById(categoryId).select("parent").lean();
  if (!category) throw new AppError(404, "Category not found");
  if (category.parent) throw new AppError(400, "Choose a main category (one without a parent)");
};

/** "فروشگاه من" → "فروشگاه-من", "My Shop!" → "my-shop". Keeps Latin + Persian/Arabic letters and digits. */
const toSlug = (text = "") =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u200c\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** A slug no other store uses: "name", then "name-2", "name-3", ... */
const uniqueStoreSlug = async (wanted, name, excludeId = null) => {
  const base = toSlug(wanted) || toSlug(name) || "store";
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    if (!(await Store.exists(filter))) return candidate;
  }
  return `${base}-${Date.now()}`;
};

// fields a store owner may never set on their own store
const STORE_PROTECTED_FIELDS = ["owner", "isVerified", "meta", "wallet", "_id", "createdAt", "updatedAt"];

const stripProtectedStoreFields = (data = {}) => {
  const safe = { ...data };
  STORE_PROTECTED_FIELDS.forEach((f) => delete safe[f]);
  return safe;
};

module.exports = { assertTopLevelCategory, toSlug, uniqueStoreSlug, stripProtectedStoreFields };
