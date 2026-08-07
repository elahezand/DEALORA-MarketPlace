import { useGet, useDelete, usePost, usePatch } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";

export const useGetMyCart = () => 
  useGet<any>('/cart/me', undefined, { staleTime: 0 });

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return usePost('/cart/me/items', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useDelete((data: { offerId: string }) => `/cart/me/items/${data.offerId}`, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useDelete(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
  });
};

export const useUpdateCart = () => {
  const queryClient = useQueryClient();
  return usePatch(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  return usePatch(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();
  return usePost('/orders/checkout', {
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
      // If payment URL exists, redirect to Zarinpal
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => console.error("Checkout failed", error),
  });
};