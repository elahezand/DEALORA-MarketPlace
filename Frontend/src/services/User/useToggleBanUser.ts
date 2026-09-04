import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/users";

export const useToggleBanUser = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePost<
    { message: string },
    { id: string }
  >((d) => `${ENDPOINT}/${d.id}/ban`, {
    onSuccess: (res) => {
      toast.success(res?.message || "Operation successful");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Action failed",
  });

  return {
    mutate,
    isPending,
  };
};