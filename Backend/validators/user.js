const { z } = require("zod");
const citiesByState = require("../data/cities.json");

// BUGFIX: cities.json stores city names in UPPERCASE (e.g. "BIRMINGHAM"),
// some with stray leading/trailing whitespace (e.g. " BRANCHVILLE ").
// The old code lower-cased the incoming city and did a plain array
// `.includes()` against that UPPERCASE list, so the check *always*
// failed - the city/state combo was rejected even when it was correct.
// We now build normalized (trimmed + uppercased) lookup sets once,
// and also allow the state name to be matched case-insensitively.
const normalize = (s) => String(s).trim().toUpperCase();

const citySetByStateKey = Object.fromEntries(
  Object.entries(citiesByState).map(([state, cities]) => [
    normalize(state),
    new Set(cities.map(normalize)),
  ])
);

const addressSchema = z.object({
  name: z.string().min(1),
  postalCode: z.string().min(4).max(20),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().min(5),
  state: z.string().min(1),
  city: z.string().min(1),
}).refine(
  (data) => {
    const cities = citySetByStateKey[normalize(data.state)];
    return !!cities && cities.has(normalize(data.city));
  },
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