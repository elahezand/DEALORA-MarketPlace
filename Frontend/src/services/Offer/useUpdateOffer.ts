import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { Offer } from "@/types/Offer";

const ENDPOINT = "/offers";

export interface UpdateOfferPayload {
  offerId: string;
  price?: number;
  stock?: number;
  description?: string;
}

export const useUpdateOffer = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: Offer },
    UpdateOfferPayload
  >((d) => `${ENDPOINT}/${d.offerId}`, {
    onSuccess: () => {
      toast.success("Offer updated");
      queryClient.invalidateQueries({ queryKey: ["/offers/me"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to update offer",
  });
};