import { useQueryClient } from "@tanstack/react-query";
import {usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/coupon/admin";

export const useToggleActiveCoupon = () => {
  const queryClient = useQueryClient();

  return usePatch<any, { _id: string; isActive: boolean }>(
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