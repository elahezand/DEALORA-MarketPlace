import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
const ENDPOINT = "/comments/admin";

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useDelete<any, { id: string }>((d) => `/comments/${d.id}`, {
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });
};