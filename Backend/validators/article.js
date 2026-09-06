const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "id") =>
  z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: `Invalid ${field}`,
  });

const SLUG = /^[a-z0-9-]+$/;

exports.createArticleSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().toLowerCase().regex(SLUG, {
    message: "slug can only contain lowercase letters, numbers and hyphens",
  }),
  excerpt: z.string().trim().min(10).max(300),
  content: z.string().trim().min(20),
  category: objectId("category").nullable().optional().default(null),
  isPublished: z.boolean().optional().default(true),
});

exports.updateArticleSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG, {
        message: "slug can only contain lowercase letters, numbers and hyphens",
      })
      .optional(),
    excerpt: z.string().trim().min(10).max(300).optional(),
    content: z.string().trim().min(20).optional(),
    category: objectId("category").nullable().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for the update",
  });
