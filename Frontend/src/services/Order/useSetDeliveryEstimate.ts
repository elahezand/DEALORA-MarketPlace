import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";
import { ISellerOrder } from "@/types/Order";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/* SELLER — change when this seller's shipped items should arrive (the buyer is notified) */
export const useSellerSetDeliveryEstimate = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, estimatedDeliveryAt }: { order: ISellerOrder; estimatedDeliveryAt: string }) => {
      const shipped = order.items.filter((item) => item.fulfillment?.status === "shipped");
      for (const item of shipped) {
        await api.patch(`/orders/seller/${order._id}/items/${item._id}/delivery-estimate`, { estimatedDeliveryAt });
      }
    },
    onSuccess: () => {
      toast.success("Delivery time updated — the buyer was notified");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not update the delivery time")),
  });
};

/* ADMIN — change the expected arrival of one shipped item */
export const useAdminSetDeliveryEstimate = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, itemId, estimatedDeliveryAt }: { orderId: string; itemId: string; estimatedDeliveryAt: string }) =>
      (await api.patch(`/orders/admin/${orderId}/items/${itemId}/delivery-estimate`, { estimatedDeliveryAt })).data,
    onSuccess: () => {
      toast.success("Delivery time updated — the buyer was notified");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not update the delivery time")),
  });
};
