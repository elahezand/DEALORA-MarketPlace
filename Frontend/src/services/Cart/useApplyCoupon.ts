import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";



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