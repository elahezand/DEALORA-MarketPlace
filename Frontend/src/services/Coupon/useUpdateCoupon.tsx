
import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { CouponMutationResponse, UpdateCouponPayload } from "@/types/Coupon";
const ENDPOINT = "/coupon/admin";

export const useUpdateCoupon = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return usePatch<CouponMutationResponse, UpdateCouponPayload>((d) => `${ENDPOINT}/${d._id}`, {
        onSuccess: () => {
            toast.success("Coupon updated");
            queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
            onSuccessCallback?.();
        },
        errorFallback: "Failed to update coupon",
    });
};