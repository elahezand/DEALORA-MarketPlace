const { z } = require("zod");
const createNotificationSchema = z.object({
    msg: z.string().min(1, "Message is required"),
    admin: z.string().optional(),
    see: z.number().optional(),
});

const updateNotificationSchema = createNotificationSchema.partial();

module.exports = {
    createNotificationSchema,
    updateNotificationSchema,
};
