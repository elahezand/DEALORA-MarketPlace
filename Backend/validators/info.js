const { z } = require("zod");

const phoneSchema = z.string().regex(/^(\+?\d{10,15})$/);

const emailSchema = z.string().email();

const urlOptional = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal(""));

const createInfoSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  logo: z.string().min(1),
  address: z.string().optional().or(z.literal("")),
  socials: z
    .object({
      instagram: urlOptional,
      telegram: urlOptional,
      linkedin: urlOptional,
    })
    .optional(),
});

const updateInfoSchema = createInfoSchema.partial();

module.exports = {
  createInfoSchema,
  updateInfoSchema,
};