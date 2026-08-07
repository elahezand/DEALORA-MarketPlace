import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/categories";

export const useCreateCategory = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<{ success: boolean; message: string }, any>(ENDPOINT, {
    onSuccess: (res) => {
      toast.success(res.message || "Category created");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to create category"),
  });
};