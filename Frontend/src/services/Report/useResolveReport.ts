import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IReport } from "@/types/Report";

const ENDPOINT = "/reports/admin";

export const useResolveReport = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; data: IReport },
    { id: string; status: string; note?: string; actionTaken: string }
  >((d) => `${ENDPOINT}/${d.id}/resolve`, {
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });
};