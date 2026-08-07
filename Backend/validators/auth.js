const z = require("zod");

const phoneSchema = z.object({
    phone: z
        .string()
        .length(11, "Phone number must be 11 digits")
        .regex(/^09\d{9}$/, "Invalid Iranian phone number"),
});

const verifySchema = z.object({
    phone: z
        .string()
        .length(11)
        .regex(/^09\d{9}$/),
    code: z.string().min(5),
});



module.exports = {
    phoneSchema,
    verifySchema
};