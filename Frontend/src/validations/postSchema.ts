import { z } from "zod";

export const stepSchemas = [
  // STEP 0
  z.object({
    snapshot: z.object({
      categoryPath: z.array(z.any()).min(1, "Select category"),
    }),
  }),

  // STEP 1
  z.object({
    snapshot: z.object({
      title: z.string().min(1, "Title required"),
      description: z.string().min(1, "Description required"),
    }),
    condition: z.enum(["new", "used"]),
  }),

  // STEP 2
  z.object({
    snapshot: z.object({
      specs: z.object({
            key: z.string().optional(),
            value: z.string().optional(),
          })
        
        .optional(),

    }),
  }),

  // STEP 3
  z.object({
    price: z.number().min(1, "Price required"),

    shipping: z.object({
      type: z.enum(["standard", "express"]),
      cost: z.number().min(0, "Cost must be 0 or more"),
    }),
  }),

  // STEP 4
  z.object({
    location: z.object({
      state: z.string().min(1, "State required"),
      city: z.string().min(1, "City required"),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  }),

  // STEP 5
  z.object({
    snapshot: z.object({
      images: z.array(z.string()).min(1, "At least 1 image required"),
    }),
  }),
];

export const postSchema = z.object({
  snapshot: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    images: z.array(z.string()).min(1, "At least 1 image required"),
    categoryPath: z.array(z.string()).min(1, "Please select category"),
    specs: z.any().optional(),
  }),

  location: z.object({
    state: z.string().min(1, "City is required"),
    city: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
  }),

  price: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => v > 0, {
      message: "Price must be greater than 0",
    }),

  shipping: z.object({
    type: z.string().min(1, "Shipping type is required"),
    cost: z.number().optional(),
  }),

  condition: z.string(),
});