import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/notifications";

export const useCreateNotification = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<any, { msg: string; admin?: string }>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Note added");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to add note",
  });
};

