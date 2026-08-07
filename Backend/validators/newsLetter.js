const { z } = require("zod");

const createNewsletterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});
module.exports = createNewsletterSchema;