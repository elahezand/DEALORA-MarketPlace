const { z } = require("zod");

// VARIANT

const variantSchema = z.object({
  attributes: z.record(z.string(), z.string()),

  sku: z
    .string()
    .trim()
    .min(1, "SKU is required"),

  price: z
    .coerce
    .number()
    .min(0)
    .optional(),

  stock: z
    .coerce
    .number()
    .int()
    .min(0)
    .default(0),
});

// SPEC VALUE

const specValueSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
  ])
  .transform(String);

// BASE LISTING

const baseListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150),

  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(3000),

  images: z
    .array(z.string())
    .max(10)
    .optional(),

  categoryPath: z
    .array(
      z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid category ID"
      )
    )
    .min(1, "Category path is required"),

  price: z
    .coerce
    .number()
    .min(0, "Price must be >= 0"),

  condition: z
    .enum(["new", "used"])
    .default("new"),

  specs: z
    .record(z.string(), specValueSchema)
    .optional(),

  tags: z
    .array(z.string())
    .optional(),
});

// CREATE LISTING

const createListingSchema = z.discriminatedUnion(
  "listingType",
  [
    // USER AD

    baseListingSchema.extend({
      listingType: z.literal("user_ad"),

      location: z.object({
        state: z
          .string()
          .trim()
          .min(1, "State is required"),

        city: z
          .string()
          .trim()
          .min(1, "City is required"),
      }),

      shipping: z
        .object({
          type: z
            .enum([
              "standard",
              "express",
              "free",
            ])
            .default("standard"),

          cost: z
            .coerce
            .number()
            .nonnegative()
            .default(0),
        })
        .optional(),
    }),

    // STORE PRODUCT

    baseListingSchema.extend({
      listingType: z.literal("store_product"),

      variants: z
        .array(variantSchema)
        .min(
          1,
          "Store products must have at least one variant"
        ),
    }),
  ]
);

// UPDATE LISTING

const updateListingSchema = baseListingSchema
  .partial()
  .extend({
    listingType: z.enum([
      "user_ad",
      "store_product",
    ]),

    location: z
      .object({
        state: z
          .string()
          .trim()
          .min(1),

        city: z
          .string()
          .trim()
          .min(1),
      })
      .partial()
      .optional(),

    shipping: z
      .object({
        type: z.enum([
          "standard",
          "express",
          "free",
        ]),

        cost: z
          .coerce
          .number()
          .nonnegative(),
      })
      .partial()
      .optional(),

    variants: z
      .array(variantSchema)
      .optional(),
  });

// UPDATE STATUS

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "accepted",
    "rejected",
    "deleted",
    "active",
    "inactive",
    "draft",
  ]),
});

// UPDATE VARIANTS

const updateVariantsSchema = z.object({
  variants: z
    .array(variantSchema)
    .min(
      1,
      "Variants array cannot be empty"
    ),
});

// EXPORT

module.exports = {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
  updateVariantsSchema,
};