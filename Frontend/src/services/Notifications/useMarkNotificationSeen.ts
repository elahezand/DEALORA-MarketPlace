import { ApiMessageResponse } from "@/types/common";
import { useQueryClient } from "@tanstack/react-query";
import { usePut} from "@/utils/hooks/useReactQueryHooks";

const ENDPOINT = "/notifications";
export const useMarkNotificationSeen = () => {
  const queryClient = useQueryClient();

  return usePut<ApiMessageResponse, { id: string }>((d) => `${ENDPOINT}/${d.id}`, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Action failed",
  });
};
