import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { CheckoutResponse } from "@/types/Cart";




export const useCheckout = () => {
    const queryClient = useQueryClient();
    return usePost<CheckoutResponse>('/orders/checkout', {
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
            if (data?.data?.paymentUrl) {
                window.location.href = data.data.paymentUrl;
            }
        },
        errorFallback: "Checkout failed",
    });
};
