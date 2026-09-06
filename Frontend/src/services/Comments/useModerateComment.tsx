import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/interceptor";
import { toast } from "sonner";

interface ModeratePayload {
  id: string;
  status: string;
  rejectReason?: string;
}

interface ModerateResponse {
  message: string;
  data: unknown;
}

export const useModerateComment = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: ModeratePayload) => {
      const { data } = await api.patch<ModerateResponse>(
        `/comments/${id}/moderate`,
        body
      );
      return data;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Comment updated");
      queryClient.invalidateQueries({ queryKey: ["admin-comments-pending"] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error("Action failed");
    },
  });
};