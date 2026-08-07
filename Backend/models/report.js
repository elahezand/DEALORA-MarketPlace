const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const reportSchema = new Schema(
  {
    reporter: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["listing", "store", "comment", "user"],
      required: true,
    },

    targetId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "fraud",           
        "inappropriate",  
        "duplicate",      
        "fake",           
        "prohibited_item", 
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "rejected"],
      default: "pending",
      index: true,
    },

    resolution: {
      resolvedBy: {
        type: Types.ObjectId,
        ref: "User",
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      note: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
      actionTaken: {
        type: String,
        enum: ["none", "content_removed", "user_banned", "warning_sent"],
        default: "none",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ targetType: 1, status: 1 });

module.exports = mongoose.models.Report || mongoose.model("Report", reportSchema);
