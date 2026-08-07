const { z } = require("zod");

const createContactSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email(),

  // FIX: match DB (Iran format)
  phone: z.string().regex(/^09\d{9}$/, "Invalid phone number"),

  body: z.string().trim().min(1).max(2000),
});

const answerContactSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

module.exports = {
  createContactSchema,
  answerContactSchema,
};