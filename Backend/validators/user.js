const { z } = require("zod");
const citiesByState = require("../data/cities.json");

const addressSchema = z.object({
  name: z.string().min(1),
  postalCode: z.string().min(4).max(20),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().min(5),
  state: z.string().min(1),
  city: z.string().min(1).transform(s => String(s).toLowerCase()),
}).refine(
  data => (citiesByState[data.state] || []).includes(data.city),
  { path: ["city"], message: "city is not valid for the given state" }
);

const roleEnum = z.enum(["USER", "ADMIN", "SELLER"]);

const createUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  phone: z.string().regex(/^\d{10,15}$/, { message: "Invalid phone" }),
  role: z.array(roleEnum).default(["USER"]),
  addresses: z.array(addressSchema).optional(),
  profilePicture: z.string().url().optional(),
  refreshToken: z.any().optional()
});

const updateUserSchema = createUserSchema.partial();

module.exports = {
  createUserSchema,
  updateUserSchema,
  addressSchema,
};