const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const conversationSchema = new Schema(
  {
    participants: {
      type: [Types.ObjectId],
      ref: "User",
      required: true,
      validate: [(v) => v.length === 2, "A conversation must have exactly 2 participants"],
    },

    listing: {
      type: Types.ObjectId,
      ref: "Listing",
      default: null,
      index: true,
    },

    lastMessage: {
      body: { type: String, trim: true, default: "" },
      sender: { type: Types.ObjectId, ref: "User", default: null },
      sentAt: { type: Date, default: null },
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// جلوگیری از ساخت دو مکالمه تکراری برای یه آگهی مشخص بین همون دو نفر
conversationSchema.index({ participants: 1, listing: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports =
  mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
