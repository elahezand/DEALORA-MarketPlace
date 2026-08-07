import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/stores";

export const useVerifyStore = () => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string },
    { id: string; isVerified: boolean }
  >((d) => `${ENDPOINT}/${d.id}/verify`, {
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });
};