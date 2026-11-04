import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps } from "@/types/Listings";
import { toFormData } from "@/utils/formData";

export const useCreatePost = (onSuccessCallback?: () => void) => {
  const { mutate: rawMutate, isPending } = usePost<{ message: string; data: ListingProps }, FormData>(
    "/listings",
    {
      onSuccess: () => {
        toast.success("Post Created Successfully :)");
        onSuccessCallback?.();
      },
      errorFallback: "Failed to create listing.",
    }
  );

  const mutate = (payload: Record<string, unknown>) => {
    rawMutate(toFormData(payload));
  };

  return {
    mutate,
    isPending,
  };
};