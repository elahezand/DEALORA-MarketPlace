import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { IOrder } from "@/types/Order";

export const useCancelOrder = () => {
  return useDelete<{ success: boolean; data: IOrder }, { id: string }>(
    (data) => `/orders/${data.id}`,
    {
      errorFallback: "Failed to cancel order.",
    }
  );
};
