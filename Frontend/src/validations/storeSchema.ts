import { z } from "zod";

export const storeStepSchemas = [
  // STEP 0: BASIC INFO
  z.object({
    name: z.string().min(2, "Store name is required"),
    phone: z.string().min(8, "Enter a valid phone number"),
  }),

  // STEP 1: ADDRESS
  z.object({
    address: z.object({
      province: z.string().min(1, "Province is required"),
      city: z.string().min(1, "City is required"),
      street: z.string().min(1, "Street address is required"),
      postalCode: z.string().min(1, "Postal code is required"),
    }),
  }),

  // STEP 2: LOGO
  z.object({
    logo: z.string().min(1, "Please upload a store logo"),
  }),

  // STEP 3: REVIEW
  z.object({}),
];

export const storeSchema = z.object({
  name: z.string().min(2, "Store name is required"),

  phone: z.string().min(8, "Enter a valid phone number"),

  logo: z.string().min(1, "Please upload a store logo"),

  address: z.object({
    province: z.string().min(1, "Province is required"),
    city: z.string().min(1, "City is required"),
    street: z.string().min(1, "Street address is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
});