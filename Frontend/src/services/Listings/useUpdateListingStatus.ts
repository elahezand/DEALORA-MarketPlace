import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps } from "@/types/Listings";

const ENDPOINT = "/listings/admin";

export const useUpdateListingStatus = (onSettledCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: ListingProps },
    { id: string; status: "accepted" | "rejected" }
  >((d) => `/listings/${d.id}/status`, {
   
    onSuccess: (res) => {
      toast.success(res?.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
    onSettled: () => {
      onSettledCallback?.();
    },
  });
};