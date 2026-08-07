import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ProcessWithdrawalPayload } from "@/types/Withdrawal";

const ENDPOINT = "/withdrawals/admin";

export const useProcessWithdrawal = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePatch<
    { message: string },
    ProcessWithdrawalPayload
  >((d) => `${ENDPOINT}/${d.id}/process`, {
    onSuccess: () => {
      toast.success("Withdrawal updated");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Action failed"),
  });

  return {
    mutate,
    isPending,
  };
};