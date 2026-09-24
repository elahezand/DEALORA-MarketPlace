import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";

/* POST /orders/admin/:id/delivered — admin confirms delivery of ONE shipped order */
export const useAdminMarkDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => (await api.post(`/orders/admin/${orderId}/delivered`)).data,
    onSuccess: () => {
      toast.success("Order marked as delivered — seller funds released");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not mark the order as delivered");
    },
  });
};
