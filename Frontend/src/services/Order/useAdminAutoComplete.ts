import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { usePost } from "@/utils/hooks/useReactQueryHooks";

export const useAdminAutoComplete = () => {
  const queryClient = useQueryClient();

  return usePost("/orders/admin/auto-complete", {
    onSuccess: () => {
      toast.success("Order checks finished");

      queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
      });
    },
    errorFallback: "Failed to run the order checks",
  });
};