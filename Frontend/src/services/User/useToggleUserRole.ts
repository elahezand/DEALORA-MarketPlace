import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/users";

export const useToggleUserRole = () => {
  const queryClient = useQueryClient();

  return usePatch<{ success: boolean; message: string; data: { role: string[] } }, { id: string }>(
    (d) => `${ENDPOINT}/${d.id}/role`,
    {
      onSuccess: (res) => {
        toast.success(res?.message || "Role updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      },
      errorFallback: "Action failed",
    }
  );
};