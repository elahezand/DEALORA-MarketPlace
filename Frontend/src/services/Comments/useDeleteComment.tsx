import { ApiMessageResponse } from "@/types/common";
import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useDelete<ApiMessageResponse, { id: string }>((d) => `/comments/admin/${d.id}`, {
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["/comments/admin"] });
    },
    errorFallback: "Action failed",
  });
};