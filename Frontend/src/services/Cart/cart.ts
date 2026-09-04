import { useGet, useDelete, usePost, usePatch } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetMyCart = () => 
  useGet<any>('/cart/me', undefined, { staleTime: 0 });

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return usePost('/cart/me/items', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
      toast.success("Added to cart");
    },
    errorFallback: "Couldn't add this item to the cart",
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useDelete((data: { offerId: string }) => `/cart/me/items/${data.offerId}`, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
    errorFallback: "Couldn't remove this item",
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useDelete(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
    errorFallback: "Couldn't clear the cart",
  });
};

export const useUpdateCart = () => {
  const queryClient = useQueryClient();
  return usePatch(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
    errorFallback: "Couldn't update the cart",
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  return usePatch(() => '/cart/me', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
      toast.success("Coupon applied");
    },
    errorFallback: "Couldn't apply this coupon",
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();
  return usePost('/orders/checkout', {
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    errorFallback: "Checkout failed",
  });
};
