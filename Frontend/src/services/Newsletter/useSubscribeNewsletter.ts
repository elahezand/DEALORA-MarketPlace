import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ApiError } from "@/types/api/ErrorTypes";

export const useSubscribeNewsletter = (onSubscribed?: () => void) => {
  return usePost<{ message: string }, { email: string }>("/newsletters", {
    onSuccess: () => {
      toast.success("Subscribed successfully! Welcome aboard.");
      onSubscribed?.();
    },
    onError: (error: ApiError) => {
      // Kept as a full onError (not just errorFallback) because 409 needs
      // genuinely different handling (info, not an error) — not just a
      // different fallback string.
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 409) {
        toast.info(message || "This email is already subscribed.");
        onSubscribed?.();
        return;
      }

      toast.error(message || "Something went wrong, please try again.");
    },
  });
};
