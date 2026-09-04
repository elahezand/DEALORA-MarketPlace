import { useQueryClient } from "@tanstack/react-query";
import { usePut} from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/notifications";
export const useMarkNotificationSeen = () => {
  const queryClient = useQueryClient();

  return usePut<any, { id: string }>((d) => `${ENDPOINT}/${d.id}`, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Action failed",
  });
};
