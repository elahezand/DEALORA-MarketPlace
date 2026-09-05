import { ZodSchema } from "zod";

export const validateWithZod =
    <T>(schema: ZodSchema<T>) => (values: unknown) => {
        const result = schema.safeParse(values);

        if (result.success) return {};

        const errors: Record<string, string> = {};

        result.error.issues.forEach((err) => {
            const path = err.path.join(".");
            errors[path] = err.message;
        });

        return errors;
    };