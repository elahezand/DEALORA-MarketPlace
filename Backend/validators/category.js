const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "id") =>
  z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: `Invalid ${field}`,
  });

const SLUG = /^[a-z0-9-]+$/i;

const OptionSchema = z.object({
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
  metadata: z.any().optional(),
});

const FieldSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(SLUG),
  description: z.string().optional().default(""),

  // هماهنگ با frontend
  type: z.enum(["select", "radio", "boolean", "text"]),

  required: z.boolean().optional().default(false),

  options: z.array(OptionSchema).default([]),
});

const CategorySchema = z.object({
  title: z.string().trim().min(1),

  parent: objectId("parent").nullable().optional(),

  slug: z.string().trim().regex(SLUG),

  description: z.string().optional().default(""),

  filters: z.array(FieldSchema).default([]),

  isActive: z.boolean().optional(),

  metadata: z.any().optional(),
});

const UpdateCategorySchema = z.object({
  title: z.string().trim().min(1).optional(),

  parent: objectId("parent").nullable().optional(),

  slug: z.string().trim().regex(SLUG).optional(),

  description: z.string().optional(),

  filters: z.array(FieldSchema).optional(),

  isActive: z.boolean().optional(),

  metadata: z.any().optional(),
});

module.exports = {
  CategorySchema,
  UpdateCategorySchema,
};