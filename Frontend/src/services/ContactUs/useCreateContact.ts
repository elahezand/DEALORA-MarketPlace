import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ContactFormValues } from "@/types/Contact"

export const useCreateContact = (onSuccessCallback?: () => void) => {
  const { mutate, isPending, ...rest } = usePost<ContactFormValues>("/contacts", {
    onSuccess: () => {
      toast.success("Your message was sent successfully!");
      if (onSuccessCallback) onSuccessCallback();
    },
    errorFallback: "Something went wrong, please try again.",
  });

  return { mutate, isPending, ...rest };
};
