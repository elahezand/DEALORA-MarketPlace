import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { SESSIONS_QUERY_KEY } from "./useGetSessions";

/** Sign out every device except the current one. */
export const useLogoutOthers = () => {
  const queryClient = useQueryClient();

  type LogoutOthersResponse = { success: boolean; message: string; data: { revoked: number } };

  return usePost<LogoutOthersResponse, void>(
    "/auth/sessions/logout-others",
    {
      onSuccess: (res: LogoutOthersResponse) => {
        toast.success(res?.message || "Other devices signed out");
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      },
      errorFallback: "Failed to sign out other devices",
    }
  );
};
