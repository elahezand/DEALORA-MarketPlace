import { useQueryClient } from "@tanstack/react-query";
import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/categories";

export const useUpdateCategory = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePut<{ success: boolean; message: string }, any>(
    (d) => `${ENDPOINT}/${d._id}`,
    {
      onSuccess: (res) => {
        toast.success(res.message || "Category updated");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
        onSuccessCallback?.();
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to update category"),
    }
  );
};