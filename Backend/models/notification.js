const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    msg: {
      type: String,
      required: true,
    },
    admin: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: false,
    },
    see: {
      type: Number,
      default: 0,
    },
  },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: {
            virtuals: true,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
