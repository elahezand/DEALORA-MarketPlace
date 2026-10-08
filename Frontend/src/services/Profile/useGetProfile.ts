import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { IStore } from "@/types/Store";
import { UserType } from "@/types/User";

export const useGetProfile = () => {
  const { data, error, isError, isLoading } = useGet<UserType>(
    "/auth/me",
    undefined,
    {
      axiosConfig: { silentAuth: true },
      silentError: true,
      // a guest gets 401 — retrying (3x by default) fired ~8 requests per page and
      // kept dashboards on a spinner for seconds before redirecting
      retry: false,
    }
  );

  return {
    user: data?.data?.user ?? null,
    store: (data?.data?.user?.store ?? null) as IStore | null,
    hasStore: !!data?.data?.user?.store,
    isLoading,
    isError,
    error: isError ? error : null,
  };
};