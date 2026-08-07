const Favorite = require("../models/wishList");
const Listing = require("../models/listing");
const paginate = require("../utils/helper");

/* === GET USER FAVORITES === */
async function getUserFavorites(userId, query = {}) {
    const limit = Math.min(query.limit ? Number(query.limit) : 20, 50);

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
        throw {
            status: 404,
            message: "Product not found",
        };
    }

    const exists = await Favorite.findOne({
        user: userId,
        product: productId,
    });

    if (exists) {
        throw {
            status: 409,
            message: "Already in favorites",
        };
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
        throw {
            status: 404,
            message: "Favorite not found",
        };
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

module.exports = {
    getUserFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoriteCount,
};