import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/contacts";

export const useDeleteSupportMessage = () => {
  const queryClient = useQueryClient();

  return useDelete<{ success: boolean; message?: string }, { id: string }>((d) => `${ENDPOINT}/${d.id}`, {
    onSuccess: () => {
      toast.success("Message deleted");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Failed to delete",
  });
};