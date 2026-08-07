import { ZodSchema } from "zod";

export const validateWithZod =
    (schema: ZodSchema) => (values: any) => {
        const result = schema.safeParse(values);

        if (result.success) return {};

        const errors: any = {};

        result.error.issues.forEach((err) => {
            const path = err.path.join(".");
            errors[path] = err.message;
        });

        return errors;
    };