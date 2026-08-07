const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Comment = require("../models/comment");
const paginate = require("../utils/helper");
const invalidateCache = require("../utils/cache");

const isValidId = mongoose.Types.ObjectId.isValid;

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function buildListingFilters(query) {
  const filters = {};

  if (query.listingType) filters.listingType = query.listingType;

  if (query.status) {
    filters.status = query.status;
  } else if (query.listingType === "user_ad") {
    filters.status = "accepted";
  } else if (query.listingType === "store_product") {
    filters.status = "active";
  } else {
    filters.$and = (filters.$and || []).concat([
      {
        $or: [
          { listingType: "user_ad", status: "accepted" },
          { listingType: "store_product", status: "active" },
        ],
      },
    ]);
  }

  if (query.sku) filters["variants.sku"] = query.sku;

  if (query.categoryId && isValidId(query.categoryId)) {
    filters.categoryPath = new mongoose.Types.ObjectId(query.categoryId);
  }


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

  if (query.city) {
    filters["location.city"] = { $regex: new RegExp(escapeRegex(query.city), "i") };
  }
  if (query.neighborhood) {
    filters["location.neighborhood"] = { $regex: new RegExp(escapeRegex(query.neighborhood), "i") };
  }

  for (const [key, value] of Object.entries(query)) {
    if (["color", "size"].includes(key)) {
      filters[`variants.attributes.${key}`] = value;
    }
  }

  const reservedKeys = [
    "categoryId", "price", "status", "q", "color", "size",
    "sku", "city", "neighborhood", "listingType", "limit", "page", "cursor"
  ];

  for (const [key, value] of Object.entries(query)) {
    if (!reservedKeys.includes(key)) {
      filters[`specs.${key}`] = value;
    }
  }

  if (query.q) {
    const safeValue = escapeRegex(query.q);
    filters.$or = [
      { $text: { $search: query.q } },
      { title: { $regex: new RegExp(safeValue, "i") } },
    ];
  }

  return filters;
}
/* === GET ALL === */
async function getAllListings(query = {}) {
  const filters = buildListingFilters(query);

  const maxLimit = query.listingType === "store_product" ? 100 : 50;
  const limit = Math.min(query.limit ? Number(query.limit) : 20, maxLimit);

return await paginate(Listing, {
  limit,
  cursor: query.cursor,
  filters,
  populate: ["categoryPath", "user"],
});
}
/* === GET BY ID === */
async function getListingById(id, query = {}) {

  let listingData = await Listing.findByIdAndUpdate(
    id,
    { $inc: { "metrics.views": 1 } },
    { new: true }
  )
    .populate("categoryPath", "_id title slug")
    .populate("user", "_id name")
    .lean({ virtuals: true });

  if (!listingData) throw { status: 404, message: "Listing not found" };

  if (listingData.listingType === "store_product") {
    const [aggregatedData] = await Listing.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "product",
          as: "comments",
        },
      },
      {
        $addFields: {
          commentsCount: { $size: "$comments" },
          score: {
            $cond: [
              { $gt: [{ $size: "$comments" }, 0] },
              { $avg: "$comments.score" },
              5,
            ],
          },
        },
      },
      { $project: { comments: 0 } },
    ]);

    if (aggregatedData) {
      listingData = {
        ...aggregatedData,
        "metrics.views": listingData.metrics?.views || 0, 
        categoryPath: listingData.categoryPath,
        user: listingData.user,
      };
    }

    const commentQuery =
      typeof query === "string" ? new URLSearchParams(query) : query;
    const comments = await paginate(Comment, commentQuery, { product: id }, "user");

    return { data: listingData, comments };
  }

  return { data: listingData };
}
/* === CREATE === */
async function createListing(userId, data, files = []) {
  const payload = { ...data };

  if (files?.length) {
    payload.images = files.map((f) => `/listings/images/${f.filename}`);
  }

  if (payload.listingType === "user_ad") {
    payload.user = userId;
    payload.status = "pending";
  } else {
    payload.status = "draft";
  }

  const listing = await Listing.create(payload);
  await invalidateCache("/api/listings*");
  return listing;
}
/* === UPDATE === */
async function updateListing(id, userId, data, files = []) {
  if (!isValidId(id)) throw { status: 400, message: "Invalid listing id" };

  const listing = await Listing.findById(id);
  if (!listing) throw { status: 404, message: "Listing not found" };

  // Authorization Check
  if (listing.listingType === "user_ad" && String(listing.user) !== String(userId)) {
    throw { status: 403, message: "Unauthorized action" };
  }

  const updateData = { ...data };
  if (files?.length) {
    updateData.images = files.map((f) => `/listings/images/${f.filename}`);
  }

  Object.assign(listing, updateData);
  await listing.save();

  await invalidateCache("/api/listings*");
  return listing;
}
/* === SOFT DELETE === */
async function deleteListing(id, userId) {
  const listing = await Listing.findById(id);
  if (!listing) throw { status: 404, message: "Listing not found" };

  if (listing.listingType === "user_ad" && String(listing.user) !== String(userId)) {
    throw { status: 403, message: "Unauthorized action" };
  }

  listing.status = "deleted";
  await listing.save();

  await invalidateCache("/api/listings*");
  return true;
}

/* === MY LISTINGS === */
async function getMyListings(userId, query = {}) {
  const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

  return paginate(Listing, {
    limit,
    cursor: query.cursor,
    filters: {
      user: userId,
      status: { $ne: "deleted" },
    },
    sort: { createdAt: -1 },
    populate: ["categoryPath"],
  });
}

/* === ADMIN CHANGE STATUS === */
async function changeStatus(id, status) {
  const allowed = ["pending", "accepted", "rejected", "active", "inactive", "draft"];
  if (!allowed.includes(status)) throw { status: 400, message: "Invalid status" };

  const listing = await Listing.findByIdAndUpdate(id, { status }, { new: true });
  if (!listing) throw { status: 404, message: "Listing not found" };

  await invalidateCache("/api/listings*");
  return listing;
}
/* === GET SEARCH INDEX (LIGHTWEIGHT FOR AI SEARCH) === */
async function smartSearch  ({ prompt, budget }) {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is missing on the server!");
  }
  const query = { status: "active" };
  if (budget) {
    query.price = { $lte: Number(budget) };
  }

  const listings = await Listing.find(query)
    .select("title price condition categoryPath")
    .populate("categoryPath", "title")
    .limit(50) 
    .lean();

  if (!listings || listings.length === 0) {
    return { data: null, reason: "No active listings found matching the budget." };
  }
  const simplifiedPosts = listings.map((item) => ({
    _id: item._id,
    title: item.title,
    price: item.price || 0,
    condition: item.condition,
    category: Array.isArray(item.categoryPath)
      ? item.categoryPath.map((c) => c.title).join(" > ")
      : "",
  }));

  const systemPrompt = `You are an AI search assistant.
Analyze the available listings and match the user's request.
Return ONLY a valid JSON object without markdown formatting.
JSON Structure:
{
  "_id": "the_matching_post_id_or_null",
  "reason": "Short explanation in English explaining why this listing matches"
}

Available listings: ${JSON.stringify(simplifiedPosts)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Marketplace AI Search",
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Query: "${prompt}" ${budget ? `| Budget limit: ${budget}` : ""}`,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter Error:", response.status, errorText);
    throw new Error("Failed to communicate with AI service.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return { data: null, reason: "No matching listing found for your request." };
  }

  const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanContent);

  if (!parsed._id) {
    return { data: null, reason: parsed.reason || "No matching listing found." };
  }

  return {
    data: { _id: parsed._id },
    reason: parsed.reason,
  };
};
module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  changeStatus,
  smartSearch
};