import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/users";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useDelete<{ message: string }, { id: string }>(
    (d) => `${ENDPOINT}/${d.id}`,
    {
      onSuccess: (res) => {
        toast.success(res?.message || "User deleted");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Action failed"),
    }
  );
};