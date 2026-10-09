import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePatch } from "../../utils/hooks/useReactQueryHooks";
import { IOrder } from "../../types/Order";

/* buyer cancels one item that hasn't been shipped yet */
export const useCancelOrderItem = () => {
  const queryClient = useQueryClient();

  return usePatch<{ success: boolean; message: string; data: IOrder }, { id: string; itemId: string }>(
    (data) => `/orders/${data.id}/items/${data.itemId}/cancel`,
    {
      onSuccess: (res) => {
        toast.success(res?.message || "Item cancelled");
        queryClient.invalidateQueries({ queryKey: ["/orders/my"] });
      },
      errorFallback: "Failed to cancel this item.",
    }
  );
};
