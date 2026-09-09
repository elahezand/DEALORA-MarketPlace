import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/notifications";

export interface CreateNotificationPayload {
  msg: string;
  user: string;
}

export const useCreateNotification = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<unknown, CreateNotificationPayload>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Notification sent");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to send notification",
  });
};