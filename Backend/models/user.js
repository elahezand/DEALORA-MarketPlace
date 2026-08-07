const mongoose = require("mongoose");
const citiesByState = require("../data/cities.json");

/*ADDRESS */
const addressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true },

    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },

    address: { type: String, required: true, trim: true },

    state: {
        type: String,
        required: true,
    },

    city: {
        type: String,
        required: true,
    },
});

/*USER */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            default: "User",
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            match: /^09\d{9}$/,
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },

        role: {
            type: [String],
            enum: ["USER", "ADMIN", "SELLER"],
            default: ["USER"],
        },

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            default: null,
        },

        addresses: {
            type: [addressSchema],
            default: [],
        },

        profilePicture: {
            type: String,
            default: null,
        },

        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],

        refreshToken: {
            type: String,
        },

        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,

        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                delete ret.__v;
                return ret;
            },
        },
    }
);

/* INDEXES */

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });

/*VIRTUALS */

userSchema.virtual("listings", {
    ref: "Listing",
    localField: "_id",
    foreignField: "sellerId",
});

userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "buyerId",
});

userSchema.virtual("reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "userId",
});

const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

module.exports = User;