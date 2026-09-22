import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";
import { ISellerOrder } from "@/types/Order";

export interface ShipOrderPayload {
  order: ISellerOrder;
  trackingCode?: string;
}

/* Ships every item of this seller in the order that isn't shipped yet
   (backend: PATCH /orders/seller/:id/items/:itemId/ship — one call per item). */
export const useShipOrder = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, trackingCode }: ShipOrderPayload) => {
      const pending = order.items.filter((item) => item.fulfillment?.status !== "shipped");
      for (const item of pending) {
        await api.patch(`/orders/seller/${order._id}/items/${item._id}/ship`, { trackingCode });
      }
    },
    onSuccess: () => {
      toast.success("Order marked as shipped");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update order";
      toast.error(message);
    },
  });
};
