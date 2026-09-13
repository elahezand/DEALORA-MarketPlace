import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { Offer } from "@/types/Offer";

const ENDPOINT = "/offers";

export interface CreateOfferPayload {
  listingId: string;
  price: number;
  stock: number;
  discount?: number;
  shipsWithinDays?: number;
  description?: string;
}

export const useCreateOffer = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<
    { success: boolean; message: string; data: Offer },
    CreateOfferPayload
  >(ENDPOINT, {
    onSuccess: () => {
      toast.success("Offer submitted for review");
      queryClient.invalidateQueries({ queryKey: ["/offers/me"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to create offer",
  });
};