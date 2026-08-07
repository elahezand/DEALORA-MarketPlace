const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "id") =>
  z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: `Invalid ${field}`,
  });

const SLUG = /^[a-z0-9-]+$/i;

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  metadata: z.any().optional(),
});

const FieldSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(SLUG),
  description: z.string().optional().default(""),
  type: z.enum(["radio", "selectBox"]),
  options: z.array(OptionSchema).default([]),
});

const CategorySchema = z.object({
  title: z.string().min(1),

  parent: objectId("parent").nullable().optional(),
  slug: z.string().regex(SLUG),
  description: z.string().optional().default(""),

  filters: z.array(FieldSchema).default([]),

  isActive: z.boolean().optional(),

  metadata: z.any().optional(),
});

const UpdateCategorySchema = CategorySchema.partial();

module.exports = {
  CategorySchema,
  UpdateCategorySchema,
};