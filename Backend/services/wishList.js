const Favorite = require("../models/wishList");
const Listing = require("../models/listing");
const {paginate} = require("../utils/helper");
const AppError = require("../utils/AppError");

/* === GET USER FAVORITES === */
async function getUserFavorites(userId, query = {}) {
    const limit = Math.min(query.limit ? Number(query.limit) : 21, 48);

    return paginate(Favorite, {
        limit,
        cursor: query.cursor,
        filters: {
            user: userId,
        },
        sort: { createdAt: -1 },
        populate: {
            path: "product",
            select:
                "title slug price images status metrics condition shortIdentifier",
        },
    });
}
async function addFavorite(userId, productId, productType) {
    const product = await Listing.findById(productId);

    if (!product) {
        throw new AppError(404, "Product not found");
    }

    const exists = await Favorite.findOne({
        user: userId,
        product: productId,
    });

    if (exists) {
        throw new AppError(409, "Already in favorites");
    }

    return Favorite.create({
        user: userId,
        product: productId,
        productType: productType || product.listingType,
    });
}

async function removeFavorite(userId, productId) {
    const favorite = await Favorite.findOneAndDelete({
        user: userId,
        product: productId,
    });

    if (!favorite) {
        throw new AppError(404, "Favorite not found");
    }

    return true;
}

async function toggleFavorite(userId, productId, productType) {
    const favorite = await Favorite.findOne({
        user: userId,
        product: productId,
    });

    if (favorite) {
        await favorite.deleteOne();
        return { isFavorited: false };
    }

    await Favorite.create({
        user: userId,
        product: productId,
        productType,
    });

    return { isFavorited: true };
}

async function isFavorited(userId, productId) {
    return !!(await Favorite.exists({
        user: userId,
        product: productId,
    }));
}

async function getFavoriteCount(userId) {
    return Favorite.countDocuments({
        user: userId,
    });
}

/* === CHECK MULTIPLE PRODUCTS AT ONCE (e.g. for a listing grid) === */
async function checkFavorites(userId, productIds) {
    const idsArray = Array.isArray(productIds)
        ? productIds
        : String(productIds || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

    if (idsArray.length === 0) return [];

    const favorites = await Favorite.find({
        user: userId,
        product: { $in: idsArray },
    })
        .select("product")
        .lean();

    return favorites.map((f) => String(f.product));
}

/* === USER FAVORITES FILTERED BY PRODUCT TYPE === */
async function filterFavoritesByType(userId, type, query = {}) {
    const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

    return paginate(Favorite, {
        limit,
        cursor: query.cursor,
        filters: {
            user: userId,
            productType: type,
        },
        sort: { createdAt: -1 },
        populate: {
            path: "product",
            select:
                "title slug price images status metrics condition shortIdentifier",
        },
    });
}

/* === PUBLIC: MOST-FAVORITED PRODUCTS === */
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
        .select("title slug price images condition shortIdentifier listingType")
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
    getUserFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoriteCount,
    checkFavorites,
    filterFavoritesByType,
    getPopularProducts,
};