import { useQueryClient } from "@tanstack/react-query";
import { usePost} from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/coupon/admin";

export const useCreateCoupon = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<any, any>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Coupon created");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    onError: (err: any) =>{      
      toast.error(err?.response?.data?.message || "Failed to create coupon")}
  });
};




