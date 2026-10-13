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

/* ADMIN — the site received the cash for its own items in this order */
export const useAdminCashReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) =>
      (await api.patch(`/orders/admin/${orderId}/cash-received`)).data as { message?: string },
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

/* ADMIN — the site did NOT receive the cash for its own items */
export const useAdminCashNotReceived = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, note }: { orderId: string; note?: string }) =>
      (await api.patch(`/orders/admin/${orderId}/cash-not-received`, { note })).data as { message?: string },
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
export const askCashNotReceived = (items: {
  buyerConfirmedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
}[]): string | null => {
  // same rule as the backend (reportCashNotReceived): only these items count
  const willCancel = !items.some((item) => !item.cancelledAt && !!item.buyerConfirmedAt);
  const consequence = willCancel
    ? "These items will be CANCELLED and their stock returned (the buyer most likely refused the parcel)."
    : "The buyer says they received it, so an admin will review it.";
  if (!window.confirm(`Report that you did NOT receive the cash?\n\n${consequence}`)) return null;
  return window.prompt("What happened? (optional)", "")?.trim() ?? "";
};