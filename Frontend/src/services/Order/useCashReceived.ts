import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/* SELLER — "I received the cash" for this store's items in a cash-on-delivery order */
export const useSellerCashReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) =>
      (await api.patch(`/orders/seller/${orderId}/cash-received`)).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Cash confirmed");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      queryClient.invalidateQueries({ queryKey: ["/stats/seller"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not confirm the cash")),
  });
};

/* ADMIN — the site received the cash for one of its OWN items */
export const useAdminCashReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      (await api.patch(`/orders/admin/${orderId}/items/${itemId}/cash-received`)).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Cash confirmed");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not confirm the cash")),
  });
};

/* SELLER — "I did NOT receive the cash" for this store's items */
export const useSellerCashNotReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, note }: { orderId: string; note?: string }) =>
      (await api.patch(`/orders/seller/${orderId}/cash-not-received`, { note })).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Reported");
      queryClient.invalidateQueries({ queryKey: ["/orders/seller"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not report it")),
  });
};

/* ADMIN — the site did NOT receive the cash for one of its own items */
export const useAdminCashNotReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, itemId, note }: { orderId: string; itemId: string; note?: string }) =>
      (await api.patch(`/orders/admin/${orderId}/items/${itemId}/cash-not-received`, { note })).data as { message?: string },
    onSuccess: (res) => {
      toast.success(res?.message || "Reported");
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccessCallback?.();
    },
    onError: (err) => toast.error(errorMessage(err, "Could not report it")),
  });
};

/**
 * Asks before reporting missing cash and explains what will happen.
 * Returns the optional note, or null when the user backed out.
 */
export const askCashNotReceived = (order: {
  buyerConfirmedAt?: string | Date | null;
  items: { cashCollectedAt?: string | Date | null }[];
}): string | null => {
  // same rule as the backend (reportCashNotReceived)
  const willCancel = !order.buyerConfirmedAt && !order.items.some((item) => !!item.cashCollectedAt);
  const consequence = willCancel
    ? "The order will be CANCELLED and the stock returned (the buyer most likely refused the parcel)."
    : order.buyerConfirmedAt
      ? "The buyer says they received the order, so an admin will review it."
      : "Part of this order's cash was already confirmed, so an admin will review it.";
  if (!window.confirm(`Report that you did NOT receive the cash?\n\n${consequence}`)) return null;
  return window.prompt("What happened? (optional)", "")?.trim() ?? "";
};
