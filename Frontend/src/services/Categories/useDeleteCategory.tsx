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
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to delete category"),
      onSettled: () => {
        onSettledCallback?.();
      },
    }
  );
};