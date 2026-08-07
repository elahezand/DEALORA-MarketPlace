const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const favoriteSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    productType: {
      type: String,
      enum: ["user_ad", "store_product"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure a user can only favorite a product once
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for quick user favorites lookup
favoriteSchema.index({ user: 1, createdAt: -1 });

const Favorite =
  mongoose.models.Favorite ||
  mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;