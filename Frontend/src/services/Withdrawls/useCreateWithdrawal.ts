import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { Withdrawal } from "@/types/Withdrawal";

const ENDPOINT = "/withdrawals";

export interface CreateWithdrawalPayload {
  amount: number;
  bankAccount: { iban: string; ownerName: string };
}

export const useCreateWithdrawal = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<
    { success: boolean; message: string; data: Withdrawal },
    CreateWithdrawalPayload
  >(ENDPOINT, {
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["/withdrawals/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/stats/seller"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to submit withdrawal request",
  });
};