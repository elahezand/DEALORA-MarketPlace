import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "../../utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IAdminOrder } from "../../types/Order";

export interface AdminShipPayload {
  orderId: string;
  trackingCode?: string;
  estimatedDeliveryAt?: string;
}

/* ADMIN — ships all the site's items of the order together */
export const useAdminShipItem = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: IAdminOrder },
    AdminShipPayload
  >((d) => `/orders/admin/${d.orderId}/ship`, {
    onSuccess: (res) => {
      toast.success(res?.message || "Marked as shipped");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to ship the items",
  });
};