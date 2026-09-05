import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ContactMessage } from "@/types/Contact";

const ENDPOINT = "/contacts";

export const useAnswerSupportMessage = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<{ success: boolean; data: ContactMessage }, { id: string; content: string }>(
    (d) => `${ENDPOINT}/${d.id}/answer`,
    {
      onSuccess: () => {
        toast.success("Reply sent");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
        onSuccessCallback?.();
      },
      errorFallback: "Failed to send reply",
    }
  );
};