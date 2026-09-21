const Favorite = require("../../models/wishList");
const Listing = require("../../models/listing");

async function getPopularProducts(query = {}) {
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

    const popular = await Favorite.aggregate([
        { $group: { _id: "$product", favoritesCount: { $sum: 1 } } },
        { $sort: { favoritesCount: -1 } },
        { $limit: limit },
    ]);

    if (popular.length === 0) return [];

    const productIds = popular.map((p) => p._id);
    const listings = await Listing.find({
        _id: { $in: productIds },
        status: { $in: ["active", "accepted"] },
    })
        .select("title slug price minPrice images condition shortIdentifier listingType")
        .lean();

    const listingMap = new Map(listings.map((l) => [String(l._id), l]));

    return popular
        .map((p) => {
            const listing = listingMap.get(String(p._id));
            if (!listing) return null;
            return { ...listing, favoritesCount: p.favoritesCount };
        })
        .filter(Boolean);
}

module.exports = {
  getPopularProducts,
};
