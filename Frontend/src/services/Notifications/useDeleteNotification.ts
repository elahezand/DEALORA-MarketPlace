import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/notifications";
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useDelete<any, { id: string }>((d) => `${ENDPOINT}/${d.id}`, {
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });
};