import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { CouponMutationResponse } from "@/types/Coupon";

const ENDPOINT = "/coupon/admin";

export const useToggleActiveCoupon = () => {
  const queryClient = useQueryClient();

  return usePatch<CouponMutationResponse, { _id: string; isActive: boolean }>(
    (d) => `${ENDPOINT}/${d._id}`,
    {
      onSuccess: () => {
        toast.success("Coupon updated");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      },
      errorFallback: "Action failed",
    }
  );
};