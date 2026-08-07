const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    body: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },

    attachments: {
      type: [String], 
      default: [],
      validate: [(v) => v.length <= 5, "Maximum 5 attachments allowed"],
    },

    readAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
