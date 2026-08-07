import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/comments/admin";

export const useModerateComment = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<any, { id: string; status: string; rejectReason?: string }>(
    (d) => `/comments/${d.id}/moderate`,
    {
      onSuccess: () => {
        toast.success("Comment updated");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
        onSuccessCallback?.();
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Action failed"),
    }
  );
};

