const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const withdrawalSchema = new Schema(
  {
    store: {
      type: Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1000, 
    },

    bankAccount: {
      iban: { type: String, required: true, trim: true },
      ownerName: { type: String, required: true, trim: true },
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },

    processedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    rejectReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    trackingCode: {
      type: String,
      trim: true,
      default: null, 
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

withdrawalSchema.index({ store: 1, status: 1 });

module.exports =
  mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
