const { z } = require("zod");

exports.createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(["fixed", "percent"]),
  amount: z.number().min(0),
  maxDiscount: z.number().min(0).nullable().default(null),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().nullable().default(null),
  expiresAt: z.coerce.date().nullable().default(null),
  usageLimit: z.number().min(1).nullable().default(null),
}).refine((data) => {
  if (data.startsAt && data.expiresAt) {
    return data.expiresAt > data.startsAt;
  }
  return true;
}, {
  message: "expiresAt must be later than startsAt",
  path: ["expiresAt"],
});

exports.updateCouponSchema = z.object({
  type: z.enum(["fixed", "percent"]).optional(),
  amount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  usageLimit: z.number().min(1).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for the update",
});

exports.applyCouponSchema = z.object({
  couponCode: z.string().min(3).max(20),
});