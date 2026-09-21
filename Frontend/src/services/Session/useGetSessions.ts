import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ActiveSessionsResponse } from "@/types/Session";

export const SESSIONS_QUERY_KEY = ["/auth/sessions"];

export const useGetSessions = () => {
  const { data, isLoading, isError } = useGet<ActiveSessionsResponse>("/auth/sessions", undefined, {
    queryKey: SESSIONS_QUERY_KEY,
    staleTime: 30 * 1000,
    errorFallback: "Failed to load active devices",
  });

  return { sessions: data?.data ?? [], isLoading, isError };
};
