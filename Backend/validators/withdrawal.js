const { z } = require("zod");

exports.createWithdrawalSchema = z.object({
  amount: z.number().min(1000, "Minimum withdrawal amount is 1000"),
  bankAccount: z.object({
    iban: z.string().min(10).max(34),
    ownerName: z.string().min(3).max(100),
  }),
});

exports.processWithdrawalSchema = z
  .object({
    status: z.enum(["processing", "completed", "rejected"]),
    rejectReason: z.string().max(500).optional(),
    trackingCode: z.string().optional(),
  })
  .refine(
    (data) => data.status !== "rejected" || !!data.rejectReason,
    { message: "rejectReason is required when rejecting a withdrawal", path: ["rejectReason"] }
  );
