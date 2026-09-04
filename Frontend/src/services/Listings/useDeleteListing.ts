import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps } from "@/types/Listings";

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useDelete<ListingProps, { id: string }>(
    (data) => `/listings/${data.id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/listings/my"] });
        toast.success("Listing deleted successfully!");
      },
      errorFallback: "Failed to delete listing.",
    }
  );
};
