const { z } = require("zod");

exports.createReportSchema = z.object({
  targetType: z.enum(["listing", "store", "comment", "user"]),
  targetId: z.string().min(1, "targetId is required"),
  reason: z.enum([
    "fraud",
    "inappropriate",
    "duplicate",
    "fake",
    "prohibited_item",
    "other",
  ]),
  description: z.string().max(1000).optional().default(""),
});

exports.resolveReportSchema = z
  .object({
    status: z.enum(["reviewed", "resolved", "rejected"]),
    note: z.string().max(500).optional(),
    actionTaken: z
      .enum(["none", "content_removed", "user_banned", "warning_sent"])
      .optional()
      .default("none"),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for the update",
  });
