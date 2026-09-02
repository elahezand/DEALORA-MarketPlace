const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "id") =>
  z
    .string()
    .trim()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: `${field} is invalid`,
    });

const trimmedString = (min, max) =>
  z.string().trim().min(min).max(max);

const optionalTrimmedString = (max) =>
  z.preprocess((val) => {
    if (typeof val !== "string") return val;
    const t = val.trim();
    return t === "" ? undefined : t;
  }, z.string().trim().max(max).optional());

const uniqueStringArray = (maxItems, maxLen) =>
  z
    .array(trimmedString(1, maxLen))
    .max(maxItems)
    .transform((arr) => [...new Set(arr.map((x) => x.trim()))]);


const createCommentSchema = z
  .object({
    listing: objectId("listing"),
    rating: z.coerce.number().int().min(1).max(5),
    title: optionalTrimmedString(120),
    body: trimmedString(1, 5000),
    pros: uniqueStringArray(10, 50).optional().default([]),
    cons: uniqueStringArray(10, 50).optional().default([]),
    recommendation: z.enum([
      "recommended",
      "not_recommended",
      "no_idea",
    ]).optional(),
    parentId: objectId("parentId").optional(),
  })
  .strict();

const updateCommentByOwnerSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: optionalTrimmedString(120),
    body: trimmedString(1, 5000).optional(),
    pros: uniqueStringArray(10, 50).optional(),
    cons: uniqueStringArray(10, 50).optional(),
    recommendation: z.enum([
      "recommended",
      "not_recommended",
      "no_idea",
    ]).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required for update" }
  );

const moderateCommentSchema = z
  .object({
    status: z.enum([
      "pending",
      "approved",
      "rejected",
      "spam",
      "deleted",
    ]),
    rejectReason: optionalTrimmedString(300),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.status === "rejected" && !val.rejectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectReason"],
        message: "rejectReason is required when status is rejected",
      });
    }

    if (val.status !== "rejected" && val.rejectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectReason"],
        message: "rejectReason is only allowed when status is rejected",
      });
    }
  });

const replySchema = z
  .object({
    body: trimmedString(1, 2000),
  })
  .strict();

const addReplySchema = z
  .object({
    commentId: objectId("commentId"),
    reply: replySchema,
  })
  .strict();

module.exports = {
  createCommentSchema,
  updateCommentByOwnerSchema,
  moderateCommentSchema,
  addReplySchema,
};