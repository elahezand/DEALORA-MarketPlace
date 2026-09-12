import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "../../utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IAdminOrder } from "../../types/Order";

export interface AdminShipItemPayload {
  orderId: string;
  itemId: string;
  trackingCode?: string;
}

export const useAdminShipItem = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<
    { success: boolean; message: string; data: IAdminOrder },
    AdminShipItemPayload
  >((d) => `/orders/admin/${d.orderId}/items/${d.itemId}/ship`, {
    onSuccess: () => {
      toast.success("Item marked as shipped");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to update item",
  });
};