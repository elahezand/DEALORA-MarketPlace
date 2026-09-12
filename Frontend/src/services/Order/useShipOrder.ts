import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ISellerOrder } from "@/types/Order";

export interface ShipOrderPayload {
  orderId: string;
  trackingCode?: string;
}

export const useShipOrder = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: ISellerOrder },
    ShipOrderPayload
  >((d) => `/orders/seller/${d.orderId}/ship`, {
    onSuccess: () => {
      toast.success("Order marked as shipped");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to update order",
  });
};