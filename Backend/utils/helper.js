const mongoose = require("mongoose");
const Store = require("../models/store");
const AppError = require("./AppError");

const Offer = require("../models/offerSeller");
const Listing = require("../models/listing");
const logger = require("../utils/logger");


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
  limit = Math.min(Math.max(Number(limit) || 20, 1), 50);

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
async function buildListingFilters(query, { isAdmin = false } = {}) {
  const filters = {};
  const andConditions = [];

  // 1. Status & ListingType Filters
  if (query.listingType) {
    filters.listingType = query.listingType;
  }

  const PUBLIC_STATUSES = ["accepted", "active"];
  if (isAdmin && query.status) {
    filters.status = query.status;
  } else if (query.status && PUBLIC_STATUSES.includes(query.status)) {
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

  if (query.cities) {
    const citiesArray = String(query.cities)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (citiesArray.length > 0) {
      filters["location.city"] = {
        $in: citiesArray.map((c) => new RegExp(`^${escapeRegex(c)}$`, "i")),
      };
    }
  } else if (query.city) {
    filters["location.city"] = { $regex: new RegExp(escapeRegex(query.city), "i") };
  }

  // 7. Variants attributes (color, size)
  for (const [key, value] of Object.entries(query)) {
    if (["color", "size"].includes(key)) {
      filters[`variants.attributes.${key}`] = value;
    }
  }
  if (query.filter) {
    let parsedFilter;
    try {
      parsedFilter = JSON.parse(query.filter);
    } catch {
      throw new AppError(400, "Invalid 'filter' query parameter: must be valid JSON");
    }
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

  if (andConditions.length > 0) {
    filters.$and = andConditions;
  }

  return filters;
}


const itemKey = (item) => {
  const offerId = item.offer || item.offerId || "";
  return `${String(offerId)}::${String(item.product || "")}::${String(item.variantId || "")}`;
};
const getVariantSnapshot = (listing, variantId) => {
  if (!variantId || !listing?.variants?.length) return null;

  const variant = typeof listing.variants.id === "function"
    ? listing.variants.id(variantId)
    : listing.variants.find((v) => String(v._id) === String(variantId));

  if (!variant) return null;
  const attributes = variant.attributes instanceof Map
    ? Object.fromEntries(variant.attributes)
    : variant.attributes || null;

  return { attributes, sku: variant.sku };
};

const calculateCartTotals = async (items, couponDoc = null, shippingCost = 0) => {
  const normalizedItems = [];
  let subtotal = 0;
  const skippedItems = []; 

  const offerItems = items.filter((item) => item.offer || item.offerId);
  const directItems = items.filter((item) => !(item.offer || item.offerId));

  // ── 1) OFFER-BASED ITEMS (bought through a seller's accepted offer) ──
  const offerIds = [...new Set(offerItems.map((item) => item.offer || item.offerId).filter(Boolean))];

  const offers = await Offer.find({
    _id: { $in: offerIds },
  }).populate("product", "_id title images variants");

  const offerMap = new Map(offers.map((o) => [String(o._id), o]));

  for (const item of offerItems) {
    const offerId = item.offer || item.offerId;
    const offer = offerMap.get(String(offerId));

    if (!offer) {
      skippedItems.push({ offerId, reason: "offer_not_found" });
      continue;
    }
    if (offer.status !== "accepted") {
      skippedItems.push({ offerId, reason: "offer_not_accepted", status: offer.status });
      continue;
    }
    if (!(offer.stock > 0)) {
      skippedItems.push({ offerId, reason: "offer_out_of_stock", stock: offer.stock });
      continue;
    }
    if (offer.stock < item.quantity) {
      skippedItems.push({ offerId, reason: "insufficient_stock", stock: offer.stock, requested: item.quantity });
      continue;
    }
    if (!item.variantId) {
      skippedItems.push({ offerId, reason: "missing_variant_id" });
      continue;
    }
    if (!offer.product) {
      skippedItems.push({ offerId, reason: "offer_missing_product_ref" });
      continue;
    }

    const price = offer.finalPrice;
    subtotal += price * item.quantity;

    normalizedItems.push({
      offer: offer._id,
      store: offer.store,
      product: offer.product._id,
      variantId: item.variantId,
      variantSnapshot: getVariantSnapshot(offer.product, item.variantId),
      quantity: item.quantity,
      priceSnapshot: price,
    });
  }

  // ── 2) DIRECT ITEMS (no seller offer exists yet — buy at the listing's own price) ──
  const directProductIds = [...new Set(directItems.map((item) => item.product).filter(Boolean))];
  const listings = directProductIds.length
    ? await Listing.find({ _id: { $in: directProductIds } })
    : [];
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));

  for (const item of directItems) {
    if (!item.product) {
      skippedItems.push({ reason: "missing_product_id" });
      continue;
    }

    const listing = listingMap.get(String(item.product));
    if (!listing) {
      skippedItems.push({ productId: item.product, reason: "product_not_found" });
      continue;
    }
    if (!["active", "accepted"].includes(listing.status)) {
      skippedItems.push({ productId: item.product, reason: "product_not_available", status: listing.status });
      continue;
    }

    let price = listing.price;

    if (listing.variants && listing.variants.length > 0) {
      if (!item.variantId) {
        skippedItems.push({ productId: item.product, reason: "missing_variant_id" });
        continue;
      }

      const variant = typeof listing.variants.id === "function"
        ? listing.variants.id(item.variantId)
        : listing.variants.find((v) => String(v._id) === String(item.variantId));

      if (!variant) {
        skippedItems.push({ productId: item.product, reason: "variant_not_found" });
        continue;
      }
      if (!(variant.stock > 0)) {
        skippedItems.push({ productId: item.product, reason: "variant_out_of_stock", stock: variant.stock });
        continue;
      }
      if (variant.stock < item.quantity) {
        skippedItems.push({ productId: item.product, reason: "insufficient_stock", stock: variant.stock, requested: item.quantity });
        continue;
      }

      price = variant.price ?? listing.price;
    }

    subtotal += price * item.quantity;

    normalizedItems.push({
      offer: null,
      store: listing.listingType === "store_product" ? listing.store : null,
      product: listing._id,
      variantId: item.variantId,
      variantSnapshot: getVariantSnapshot(listing, item.variantId),
      quantity: item.quantity,
      priceSnapshot: price,
    });
  }
  if (skippedItems.length > 0) {
    logger.warn("[cart] skipped items while calculating totals:", skippedItems);
  }

  let discount = 0;
  if (couponDoc) {
    const now = new Date();
    const isValid =
      couponDoc.isActive &&
      (!couponDoc.startsAt || couponDoc.startsAt <= now) &&
      (!couponDoc.expiresAt || couponDoc.expiresAt >= now);

    if (isValid) {
      if (couponDoc.type === "percent") {
        discount = Math.floor((subtotal * Number(couponDoc.amount || 0)) / 100);
      } else if (couponDoc.type === "fixed") {
        discount = Number(couponDoc.amount || 0);
      }
      if (couponDoc.maxDiscount) {
        discount = Math.min(discount, Number(couponDoc.maxDiscount));
      }
    }
  }

  discount = Math.min(discount, subtotal);
  const finalTotal = subtotal - discount + Number(shippingCost || 0);
  return {
    items: normalizedItems,
    skippedItems,
    pricing: {
      subtotal,
      discount,
      shippingCost: Number(shippingCost || 0),
      total: finalTotal,
    },
  };
};

const mergeCartItems = (currentItems, newItems) => {
  const merged = [...currentItems];

  for (const newItem of newItems) {
    const existingIndex = merged.findIndex(
      (item) => itemKey(item) === itemKey(newItem)
    );

    if (existingIndex > -1) {
      merged[existingIndex].quantity += Number(newItem.quantity) || 1;
    } else {
      merged.push({
        offer: newItem.offer || newItem.offerId || null,
        product: newItem.product,
        variantId: newItem.variantId,
        quantity: Number(newItem.quantity) || 1,
        priceSnapshot: newItem.priceSnapshot || 0,
      });
    }
  }

  return merged;
};

module.exports = { paginate, buildListingFilters, escapeRegex, mergeCartItems, calculateCartTotals, itemKey };