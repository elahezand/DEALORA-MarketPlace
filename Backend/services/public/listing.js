const mongoose = require("mongoose");
const Listing = require("../../models/listing");
const { paginate, buildListingFilters } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { buildListingDetail, findListingForDetail } = require("../shared/listing");

const isValidId = mongoose.Types.ObjectId.isValid;
const PUBLIC_OWNER_FIELDS = "_id name username";
const PUBLIC_STATUS_BY_TYPE = { user_ad: "accepted", store_product: "active" };

const isPublicListing = (listing) => PUBLIC_STATUS_BY_TYPE[listing?.listingType] === listing?.status;

/* === GET ALL (PUBLIC) === */
async function getAllListings(query = {}) {
  const filters = await buildListingFilters(query);
  const maxLimit = query.listingType ? 21 : 10;
  const limit = Math.min(query.limit ? Number(query.limit) : maxLimit, maxLimit);

  return paginate(Listing, {
    limit,
    cursor: query.cursor,
    filters,
    populate: [
      { path: "categoryPath", select: "_id title slug" },
      { path: "owner", select: PUBLIC_OWNER_FIELDS },
    ],
    sort: { _id: -1 }
  });
}

/* === GET BY ID (PUBLIC) — only listings the public is allowed to see === */
async function getListingById(id) {
  if (!isValidId(id)) throw new AppError(400, "Invalid listing id");

  const listingData = await findListingForDetail(id);

  if (!listingData || !isPublicListing(listingData)) {
    throw new AppError(404, "Listing not found");
  }
  await Listing.updateOne({ _id: id }, { $inc: { "metrics.views": 1 } });
  listingData.metrics = { ...listingData.metrics, views: (listingData.metrics?.views || 0) + 1 };

  return buildListingDetail(listingData);
}

/* === SMART SEARCH (AI SEARCH) === */
async function smartSearch({ prompt, budget }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AppError(500, "OpenRouter API key is missing on the server");

  const query = {
    $or: [
      { listingType: "user_ad", status: "accepted" },
      { listingType: "store_product", status: "active" },
    ],
  };
  if (budget) query.minPrice = { $lte: Number(budget) };

  const listings = await Listing.find(query)
    .select("title minPrice listingType condition categoryPath")
    .populate("categoryPath", "title")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!listings.length) {
    return { data: null, reason: "No active listings found matching the budget." };
  }

  const simplifiedPosts = listings.map((item) => ({
    _id: item._id,
    title: item.title,
    price: item.minPrice ?? 0,
    condition: item.condition,
    category: Array.isArray(item.categoryPath)
      ? item.categoryPath.map((c) => c.title).join(" > ")
      : item.categoryPath?.title || "",
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

  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            content: `Query: "${String(prompt).slice(0, 500)}" ${budget ? `| Budget limit: ${budget}` : ""}`,
          },
        ],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    logger.error("OpenRouter request failed:", err);
    throw new AppError(502, "Failed to communicate with AI service.");
  }

  if (!response.ok) {
    logger.error("OpenRouter Error:", response.status, await response.text());
    throw new AppError(502, "Failed to communicate with AI service.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { data: null, reason: "No matching listing found for your request." };
  }

  try {
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    const isKnownId = simplifiedPosts.some((p) => String(p._id) === String(parsed._id));
    if (!parsed._id || !isKnownId) {
      return { data: null, reason: parsed.reason || "No matching listing found." };
    }

    return { data: { _id: parsed._id }, reason: parsed.reason };
  } catch (error) {
    logger.error("Failed to parse AI response:", content);
    return { data: null, reason: "Failed to parse search results from AI." };
  }
}

module.exports = {
  getAllListings,
  getListingById,
  smartSearch,
};
