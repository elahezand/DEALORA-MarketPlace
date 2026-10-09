import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "../../utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IOrder } from "../../types/Order";

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();

  // group = one store's part (store id, or "site"); left out = everything shipped
  return usePatch<{ success: boolean; message: string; data: IOrder }, { id: string; group?: string }>(
    (data) => `/orders/${data.id}/confirm-delivery`,
    {
      onSuccess: (res) => {
        // the server says whether it completed, or (cash) waits for the cash confirmation
        toast.success(res?.message || "Thanks! Order marked as received.");
        // the orders list shows the delivery date/time — refresh it too
        queryClient.invalidateQueries({ queryKey: ["/orders/my"] });
      },
      errorFallback: "Failed to confirm delivery.",
    }
  );
};
