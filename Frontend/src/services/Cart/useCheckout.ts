import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { CheckoutResponse } from "@/types/Cart";
import { clearCheckoutKey } from "@/utils/idempotencyKey";
import { toast } from "sonner";

export const useCheckout = (
    cartId?: string,
    onPlaced?: (orderId?: string) => void
) => {
    const queryClient = useQueryClient();

    return usePost<CheckoutResponse>("/orders/checkout", {
        onSuccess: (data) => {
            clearCheckoutKey(cartId);
            if (!data?.data?.paymentUrl) toast.success("Order placed successfully");
            queryClient.invalidateQueries({
                queryKey: ["/cart/me"],
            });

            if (data?.data?.paymentUrl) {
                window.location.href = data.data.paymentUrl;
                return;
            }

            // cash, or the wallet covered everything → no gateway, the order already exists
            onPlaced?.(data?.data?.order?._id);
        },
        errorFallback: "Checkout failed",
    });
};