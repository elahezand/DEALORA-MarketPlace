import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";
import { ISellerOrder } from "@/types/Order";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/* SELLER — one arrival time for all of this seller's shipped items (the buyer is notified) */
export const useSellerSetDeliveryEstimate = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, estimatedDeliveryAt }: { order: ISellerOrder; estimatedDeliveryAt: string }) =>
      (await api.patch(`/orders/seller/${order._id}/delivery-estimate`, { estimatedDeliveryAt })).data,
    onSuccess: () => {
      toast.success("Delivery time updated — the buyer was notified");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not update the delivery time")),
  });
};

/* ADMIN — change the arrival time of one part (group = store id, or "site") */
export const useAdminSetDeliveryEstimate = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, group, estimatedDeliveryAt }: { orderId: string; group: string; estimatedDeliveryAt: string }) =>
      (await api.patch(`/orders/admin/${orderId}/groups/${group}/delivery-estimate`, { estimatedDeliveryAt })).data,
    onSuccess: () => {
      toast.success("Delivery time updated — the buyer was notified");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not update the delivery time")),
  });
};