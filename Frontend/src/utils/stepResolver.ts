import { FieldErrors, FieldValues, Resolver, UseFormProps, UseFormReturn, get, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";

/*
   STEP RESOLVER
   multi-step wizards validate only the schema of the current step.
   `raw: true` keeps the full form values (a step schema would strip the other steps' fields).
*/
export const createStepResolver = <T extends FieldValues>(
  schemas: ZodType[],
  step: number
): Resolver<T> => {
  const schema = schemas[step];
  // steps without a schema (e.g. the review step) have nothing to validate
  if (!schema) return (values) => ({ values, errors: {} });

  return zodResolver(schema as never, undefined, { raw: true }) as unknown as Resolver<T>;
};

/* read a nested error message with a dotted path, e.g. "snapshot.title" */
export const getFieldError = <T extends FieldValues>(
  errors: FieldErrors<T>,
  path: string
): string | undefined => {
  const error = get(errors, path);
  return typeof error?.message === "string" ? error.message : undefined;
};

/*
   USE STEP FORM
   useForm for wizards. react-hook-form reads the latest options on every render,
   so after setStep the resolver of the new step is the one Next / submit runs.
*/
export const useStepForm = <T extends FieldValues>(
  schemas: ZodType[],
  step: number,
  options: Omit<UseFormProps<T>, "resolver"> = {}
): UseFormReturn<T> => {
  return useForm<T>({ ...options, resolver: createStepResolver<T>(schemas, step) });
};
