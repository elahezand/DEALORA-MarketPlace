const mongoose = require("mongoose");
const Store = require("../models/store");
const isValidId = mongoose.Types.ObjectId.isValid;

const paginate = async (
  Model,
  {
    limit,
    cursor = null,
    filters = {},
    sort = { createdAt: -1 },
    populate = null,
    select = null,
    cursorField = "_id",
  } = {}
) => {
  limit = Math.min(Math.max(Number(limit), 1), 50);

  const query = { ...filters };

  if (cursor) {
    const sortKey = Object.keys(sort)[0] || "_id";
    const sortOrder = sort[sortKey];

    query[sortKey] = sortOrder === 1
      ? { $gt: cursor }
      : { $lt: cursor };
  }

  let dbQuery = Model.find(query)
    .sort(sort)
    .limit(limit)
    .lean();

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }

  if (select) {
    dbQuery = dbQuery.select(select);
  }

  const data = await dbQuery;
  const nextCursor =
    data.length === limit
      ? data[data.length - 1][cursorField]
      : null;

  return {
    data,
    pagination: {
      limit,
      nextCursor,
      hasMore: data.length === limit,
    },
  };
};
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
async function buildListingFilters(query) {
  const filters = {};
  const andConditions = [];

  // 1. Status & ListingType Filters
  if (query.listingType) {
    filters.listingType = query.listingType;
  }

  if (query.status) {
    filters.status = query.status;
  } else if (query.listingType === "user_ad") {
    filters.status = "accepted";
  } else if (query.listingType === "store_product") {
    filters.status = "active";
  } else {
    andConditions.push({
      $or: [
        { listingType: "user_ad", status: "accepted" },
        { listingType: "store_product", status: "active" },
      ],
    });
  }

  // 2. Photos Filter -- matches Listing.images: [String]
  if (query.hasPhoto === "true") {
    filters["images.0"] = { $exists: true };
  }

  // 3. SKU Filter -- matches Listing.variants[].sku
  if (query.sku) {
    filters["variants.sku"] = query.sku;
  }

  // 4. Category Filter
  if (query.categoryId && isValidId(query.categoryId)) {
    filters.categoryPath = new mongoose.Types.ObjectId(query.categoryId);
  }

  // 5. Price Range Filter -- matches Listing.price: Number
  if (query.price) {
    if (query.price.includes("-")) {
      const [min, max] = query.price.split("-").map(Number);
      filters.price = {};
      if (!isNaN(min)) filters.price.$gte = min;
      if (!isNaN(max)) filters.price.$lte = max;
    } else {
      const p = Number(query.price);
      if (!isNaN(p)) filters.price = p;
    }
  }
  if (query.tags) {
    const tagsArray = String(query.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagsArray.length > 0) {
      filters.tags = { $in: tagsArray };
    }
  }

  if (query.condition) {
    filters.condition = query.condition;
  }
  if (query.rating) {
    const minRating = Number(query.rating);
    if (!isNaN(minRating)) {
      const matchingStores = await Store.find({
        "meta.ratings": { $gte: minRating },
      })
        .select("_id")
        .lean();

      filters.store = { $in: matchingStores.map((s) => s._id) };
    }
  }

  // 6. Location Filters
  if (query.state) {
    filters["location.state"] = { $regex: new RegExp(escapeRegex(query.state), "i") };
  }

  if (query.city) {
    filters["location.city"] = { $regex: new RegExp(escapeRegex(query.city), "i") };
  }

  // 7. Variants attributes (color, size)
  for (const [key, value] of Object.entries(query)) {
    if (["color", "size"].includes(key)) {
      filters[`variants.attributes.${key}`] = value;
    }
  }
  if (query.filter) {
    const parsedFilter = JSON.parse(query.filter);
    for (const [key, value] of Object.entries(parsedFilter)) {
      filters[`specs.${key}`] = value;
    }
  }
  // 9. Advanced Smart Search Query (q)
  if (query.q) {
    const normalizeText = (str) => {
      return str
        .toLowerCase()
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .replace(/[\u064B-\u065F]/g, "")
        .trim();
    };

    const cleanQuery = normalizeText(query.q);
    const compactQuery = cleanQuery.replace(/\s+/g, "");
    const tokens = cleanQuery.split(/\s+/).filter(Boolean);

    const searchConditions = [];

    searchConditions.push({ title: { $regex: new RegExp(escapeRegex(cleanQuery), "i") } });

    if (compactQuery !== cleanQuery) {
      searchConditions.push({ title: { $regex: new RegExp(escapeRegex(compactQuery), "i") } });
    }

    if (tokens.length > 1) {
      const allTokensCondition = tokens.map((token) => ({
        title: { $regex: new RegExp(escapeRegex(token), "i") },
      }));
      searchConditions.push({ $and: allTokensCondition });
    }

    andConditions.push({ $or: searchConditions });
  }

  // Combine and conditions safely to prevent overwriting $or
  if (andConditions.length > 0) {
    filters.$and = andConditions;
  }

  return filters;
}


module.exports = { paginate, buildListingFilters, escapeRegex };