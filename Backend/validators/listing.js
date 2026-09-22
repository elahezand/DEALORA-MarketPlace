const { z } = require("zod");

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const STORE_PRODUCT_STATUSES = ["draft", "active", "inactive"];

const shippingSchema = z.object({
  type: z.enum(["standard", "express", "free"]).default("standard"),
  cost: z.coerce.number().nonnegative().default(0),
});

// VARIANT

const variantSchema = z.object({
  // kept when editing, so carts and seller offers still point to the same variant
  _id: objectIdString.optional(),

  attributes: z.record(z.string(), z.string()),

  sku: z
    .string()
    .trim()
    .min(1, "SKU is required"),

  price: z
    .coerce
    .number()
    .min(0, "Variant price must be >= 0"),

  // Percent (0-100). finalPrice is NOT accepted — the server computes it.
  discount: z
    .coerce
    .number()
    .min(0, "Discount must be >= 0")
    .max(100, "Discount must be <= 100")
    .default(0),

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

      // Listing-level price exists ONLY for user ads
      price: z
        .coerce
        .number()
        .min(0, "Price must be >= 0"),

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

      status: z.enum(STORE_PRODUCT_STATUSES).optional(),

      shipping: shippingSchema.optional(),

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

    // Only meaningful for user_ad — ignored by the service for store products
    price: z
      .coerce
      .number()
      .min(0, "Price must be >= 0")
      .optional(),

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

    status: z.enum(STORE_PRODUCT_STATUSES).optional(),
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