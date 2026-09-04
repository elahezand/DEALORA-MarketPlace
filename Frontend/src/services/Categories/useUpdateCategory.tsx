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
      errorFallback: "Unknown Error",
    }
  );
};