const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = (field = "ID") =>
    z.string().trim().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: `Invalid ${field} ID`,
    });

const createNoteSchema = z.object({
    msg: z.string().trim().min(1, "Message is required"),
    user: objectId("user"),
    product: objectId("product"),
});

const updateNoteSchema = createNoteSchema.partial();

module.exports = { createNoteSchema, updateNoteSchema };