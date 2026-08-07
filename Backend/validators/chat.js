const { z } = require("zod");

exports.startConversationSchema = z.object({
  recipientId: z.string().min(1, "recipientId is required"),
  listingId: z.string().optional().nullable(),
  message: z.string().min(1).max(2000),
});

exports.sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  attachments: z.array(z.string()).max(5).optional().default([]),
});
