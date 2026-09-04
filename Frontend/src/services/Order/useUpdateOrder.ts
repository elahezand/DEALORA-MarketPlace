import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IOrder, OrderStatus, PaymentStatus } from "@/types/Order";

export interface AdminOrderResponse {
  success: boolean;
  data: IOrder;
}

export const useUpdateOrder = (orderId: string) => {
  const queryClient = useQueryClient();
  const endpoint = `/orders/admin/${orderId}`;

  return usePatch<
    AdminOrderResponse,
    Partial<{ status: OrderStatus; paymentStatus: PaymentStatus }>
  >(endpoint, {
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/orders/admin"] });
    },
    errorFallback: "Update failed",
  });
};