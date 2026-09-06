import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const useUpdateCart = () => {
    const queryClient = useQueryClient();
    return usePatch(() => '/cart/me', {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
            toast.success("Cart Updated");
        }, errorFallback: "Couldn't update the cart",
    });
};