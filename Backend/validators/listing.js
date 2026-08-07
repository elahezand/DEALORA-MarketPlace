const { z } = require('zod');

const variantSchema = z.object({
  attributes: z.record(z.string(), z.string()),
  sku: z.string().trim().min(1, "SKU is required"),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
});

const baseListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  description: z.string().trim().min(1, "Description is required").max(3000),
  images: z.array(z.string()).min(1, "At least one image is required").max(10),
  categoryPath: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')).min(1, "Category path is required"),
  price: z.union([z.string(), z.number()]).transform((v) => Number(v)).refine((v) => v >= 0, "Price must be >= 0"),
  condition: z.enum(["new", "used"]).default("new"),
  specs: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const createListingSchema = z.discriminatedUnion("listingType", [
  baseListingSchema.extend({
    listingType: z.literal("user_ad"),
    location: z.object({
      state: z.string().trim().min(1, "State is required"),
      city: z.string().trim().min(1, "City is required"),
    }),
    shipping: z.object({
      type: z.enum(["standard", "express", "free"]).default("standard"),
      cost: z.number().nonnegative().default(0),
    }).optional(),
  }),

  baseListingSchema.extend({
    listingType: z.literal("store_product"),
    variants: z.array(variantSchema).min(1, "Store products must have at least one variant"),
  }),
]);

const updateListingSchema = baseListingSchema.partial().extend({
  listingType: z.enum(["user_ad", "store_product"]), 
  location: z.object({
    state: z.string().trim().min(1),
    city: z.string().trim().min(1),
  }).partial().optional(),
  shipping: z.object({
    type: z.enum(["standard", "express", "free"]),
    cost: z.number().nonnegative(),
  }).partial().optional(),
  variants: z.array(variantSchema).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "deleted", "active", "inactive", "draft"]),
});

const updateVariantsSchema = z.object({
  variants: z.array(variantSchema).min(1, "Variants array cannot be empty"),
});

module.exports = { 
  createListingSchema, 
  updateListingSchema, 
  updateStatusSchema, 
  updateVariantsSchema 
};