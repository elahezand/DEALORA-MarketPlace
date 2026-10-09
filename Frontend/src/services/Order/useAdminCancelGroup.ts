import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/* ADMIN — cancel one store's part of an order (group = store id, or "site") */
export const useAdminCancelGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, group }: { orderId: string; group: string }) =>
      (await api.patch(`/orders/admin/${orderId}/groups/${group}/cancel`)).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Could not cancel this part")),
  });
};

/* ADMIN — cancel one item of an order */
export const useAdminCancelItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      (await api.patch(`/orders/admin/${orderId}/items/${itemId}/cancel`)).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Item cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Could not cancel this item")),
  });
};