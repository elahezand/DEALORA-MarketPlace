import { usePatch } from "../../utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IOrder } from "../../types/Order";

export const useConfirmDelivery = () => {
  return usePatch<{ success: boolean; message: string; data: IOrder }, { id: string }>(
    (data) => `/orders/${data.id}/confirm-delivery`,
    {
      onSuccess: () => {
        toast.success("Thanks! Order marked as received.");
      },
      errorFallback: "Failed to confirm delivery.",
    }
  );
};