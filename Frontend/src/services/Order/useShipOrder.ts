import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";
import { ISellerOrder } from "@/types/Order";

export interface ShipOrderPayload {
  order: ISellerOrder;
  trackingCode?: string;
  /** ISO string — when the buyer should receive it */
  estimatedDeliveryAt?: string;
}

/* SELLER — ships all of this seller's items in the order together */
export const useShipOrder = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, trackingCode, estimatedDeliveryAt }: ShipOrderPayload) =>
      (await api.patch(`/orders/seller/${order._id}/ship`, { trackingCode, estimatedDeliveryAt })).data,
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