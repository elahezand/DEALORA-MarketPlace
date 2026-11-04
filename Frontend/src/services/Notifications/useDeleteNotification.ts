import { ApiMessageResponse } from "@/types/common";
import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/notifications";
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useDelete<ApiMessageResponse, { id: string }>((d) => `${ENDPOINT}/${d.id}`, {
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Action failed",
  });
};