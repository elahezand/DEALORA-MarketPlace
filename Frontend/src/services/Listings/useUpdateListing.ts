import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps } from "@/types/Listings";

export type UpdateListingPayload = Pick<ListingProps,
  "listingType" | "title" | "description" | "price" | "condition" | "shipping"
>;

export interface UpdateListingResponse {
  message: string;
  data: ListingProps;
}

export const useUpdateListing = (
  listingId: string,
  onSuccessCallback?: () => void
) => {
  return usePut<UpdateListingResponse, UpdateListingPayload>(
    `/listings/${listingId}`,
    {
      onSuccess: () => {
        toast.success("Listing updated successfully");
        onSuccessCallback?.();
      },
      errorFallback: "Failed to update listing",
    }
  );
};