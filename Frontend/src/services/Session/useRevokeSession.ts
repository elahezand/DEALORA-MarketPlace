import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { SESSIONS_QUERY_KEY } from "./useGetSessions";

/** Sign out one device. Signing out the current device logs the user out here too. */
export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  type RevokeResponse = { success: boolean; data: { isCurrent: boolean } };

  return useDelete<RevokeResponse, { id: string }>(
    ({ id }) => `/auth/sessions/${id}`,
    {
      onSuccess: (res: RevokeResponse) => {
        if (res?.data?.isCurrent) {
          queryClient.setQueryData(["/auth/me", undefined], null);
          toast.success("Logged out");
          router.replace("/");
          return;
        }
        toast.success("Device signed out");
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      },
      errorFallback: "Failed to sign out the device",
    }
  );
};
