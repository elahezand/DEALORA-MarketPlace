import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { Offer, OfferStatus } from "@/types/Offer";

const ENDPOINT = "/offers";

export const useApproveOffer = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { message: string; offer: Offer },
    { offerId: string; status: OfferStatus; adminComment?: string }
  >((d) => `${ENDPOINT}/${d.offerId}/approve`, {
    onSuccess: () => {
      toast.success("Offer updated");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    errorFallback: "Action failed",
  });
};