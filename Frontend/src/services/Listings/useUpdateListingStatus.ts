import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps, ListingStatus } from "@/types/Listings";


export const useUpdateListingStatus = (onSettledCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: ListingProps },
    { id: string; status: ListingStatus }
  >((d) => `/listings/${d.id}/status`, {

    onSuccess: (res) => {
      toast.success(res?.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["listings-moderation"] });
    },
    errorFallback: "Action failed",
    onSettled: () => {
      onSettledCallback?.();
    },
  });
};