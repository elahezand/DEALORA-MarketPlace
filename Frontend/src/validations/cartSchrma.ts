import * as z from "zod";


export const checkoutSchema = z.object({
    shippingAddress: z.object({
        _id: z.string(),
        name: z.string(),
        postalCode: z.string().min(5, "Postal code is required"),
        address: z.string().min(10, "Address is too short"),
        city: z.string().min(2, "City is required"),
        state: z.string().min(2, "State is required"),
        location: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    paymentMethod: z.enum(["cash", "zarinpal"]),
});