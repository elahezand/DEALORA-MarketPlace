import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/offers";

export const useApproveOffer = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    any,
    { offerId: string; status: string; adminComment?: string }
  >((d) => `${ENDPOINT}/${d.offerId}/approve`, {
    onSuccess: () => {
      toast.success("Offer updated");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });
};