const { z } = require("zod");
const mongoose = require("mongoose");

const createNotificationSchema = z.object({
    msg: z.string().min(1, "Message is required"),
    user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid admin id",
    }),
});

const updateNotificationSchema = z.object({
    msg: z.string().min(1).optional(),
    see: z.number().optional(),
});

module.exports = {
    createNotificationSchema,
    updateNotificationSchema,
};