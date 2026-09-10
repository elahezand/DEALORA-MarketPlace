import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/offers";

export const useDeleteOffer = () => {
  const queryClient = useQueryClient();

  return useDelete<{ success: boolean; message: string }, { offerId: string }>(
    (d) => `${ENDPOINT}/${d.offerId}`,
    {
      onSuccess: () => {
        toast.success("Offer deleted");
        queryClient.invalidateQueries({ queryKey: ["/offers/me"] });
      },
      errorFallback: "Failed to delete offer",
    }
  );
};