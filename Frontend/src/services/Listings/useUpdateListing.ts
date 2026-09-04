import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export interface UpdateListingPayload {
  listingType: string;
  title: string;
  description: string;
  price: number;
  condition: "new" | "used";
  shipping: {
    type: "standard" | "express" | "free";
    cost: number;
  };
}

export const useUpdateListing = (listingId: string) => {
  return usePut<any, UpdateListingPayload>(`/listings/${listingId}`, {
    onSuccess: () => {
      toast.success("Listing updated successfully");
    },
    errorFallback: "Failed to update listing",
  });
};
