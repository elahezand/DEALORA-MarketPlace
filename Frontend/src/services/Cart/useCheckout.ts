import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { CheckoutResponse } from "@/types/Cart";
import { clearCheckoutKey } from "@/utils/idempotencyKey";




export const useCheckout = (cartId?: string) => {
    const queryClient = useQueryClient();
    return usePost<CheckoutResponse>('/orders/checkout', {
        onSuccess: (data) => {
            clearCheckoutKey(cartId);
            queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
            if (data?.data?.paymentUrl) {
                window.location.href = data.data.paymentUrl;
            }
        },
        errorFallback: "Checkout failed",
    });
};
