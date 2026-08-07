import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/contacts";

export const useAnswerSupportMessage = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<any, { id: string; content: string }>(
    (d) => `${ENDPOINT}/${d.id}/answer`,
    {
      onSuccess: () => {
        toast.success("Reply sent");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
        onSuccessCallback?.();
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to send reply"),
    }
  );
};