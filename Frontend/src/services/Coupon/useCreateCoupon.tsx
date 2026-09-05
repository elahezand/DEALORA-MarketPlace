import { useQueryClient } from "@tanstack/react-query";
import { usePost} from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { CouponMutationResponse, CreateCouponPayload } from "@/types/Coupon";

const ENDPOINT = "/coupon/admin";

export const useCreateCoupon = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  const { mutate, isPending, ...rest } = usePost<CouponMutationResponse, CreateCouponPayload>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Coupon created");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to create coupon",
  });

  return { mutate, isPending, ...rest };
};