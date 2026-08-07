const { z } = require('zod');
const mongoose = require('mongoose');
const { Types } = mongoose;

const coordinatesSchema = z.object({
  lat: z.preprocess(v => (v == null ? undefined : Number(v)), z.number()).optional(),
  lng: z.preprocess(v => (v == null ? undefined : Number(v)), z.number()).optional(),
}).optional().default({});

const addressSchema = z.object({
  province: z.preprocess(v => (v == null ? undefined : String(v).trim()), z.string()).optional(),
  city: z.preprocess(v => (v == null ? undefined : String(v).trim()), z.string()).optional(),
  street: z.preprocess(v => (v == null ? undefined : String(v).trim()), z.string()).optional(),
  postalCode: z.preprocess(v => (v == null ? undefined : String(v).trim()), z.string()).optional(),
  coordinates: coordinatesSchema,
}).optional().default({});

const metaSchema = z.object({
  ratings: z.preprocess(v => (v == null ? undefined : Number(v)), z.number()).optional().default(0),
  reviewsCount: z.preprocess(v => (v == null ? undefined : Number(v)), z.number().int()).optional().default(0),
}).optional().default({ ratings: 0, reviewsCount: 0 });

const storeSchema = z.object({
  owner: z.string().refine(v => Types.ObjectId.isValid(v), { message: 'invalid owner id' }),

  name: z.string().min(1).max(200).transform(s => s.trim()),

  slug: z.preprocess(
    v => (v == null ? undefined : String(v).trim().toLowerCase()),
    z.string()
  ).optional(),

  logo: z.preprocess(v => (v == null ? undefined : String(v)), z.string()).optional().nullable(),

  address: addressSchema,

  phone: z.preprocess(v => {
    if (v == null) return undefined;
    return String(v).trim();
  }, z.string()).optional().nullable()
    .refine(s => !s || /^\+?\d{8,15}$/.test(s), { message: 'invalid phone format' }),

  isVerified: z.boolean().optional().default(false),

  meta: metaSchema,
});

const storeUpdateSchema = z.object(storeSchema.shape).partial();

module.exports = {
  storeSchema,
  storeUpdateSchema,
};