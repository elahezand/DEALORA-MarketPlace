import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import z from 'zod';
import { contactSchema } from "@/validations/contactUs";

type ContactFormData = z.infer<typeof contactSchema>;

export const useCreateContact = (onSuccessCallback?: () => void) => {
  const { mutate, isPending, ...rest } = usePost<ContactFormData>("/contacts", {
    onSuccess: () => {
      toast.success("Your message was sent successfully!");
      if (onSuccessCallback) onSuccessCallback();
    },
    errorFallback: "Something went wrong, please try again.",
  });

  return { mutate, isPending, ...rest };
};
