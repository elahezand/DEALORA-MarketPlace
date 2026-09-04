import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/categories";

export const useDeleteCategory = (onSettledCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useDelete<{ success: boolean; message: string }, { id: string }>(
    (d) => `${ENDPOINT}/${d.id}`,
    {
      onSuccess: (res) => {
        toast.success(res.message || "Category deleted");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      },
      errorFallback: "Failed to delete category",
      onSettled: () => {
        onSettledCallback?.();
      },
    }
  );
};