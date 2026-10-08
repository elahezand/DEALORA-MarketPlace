import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ADMIN_FRESH } from "@/utils/hooks/adminQueryOptions";
import { StoresResponse } from "@/types/Store";

export const useGetStores = (limit = 5) => {
  const { data, isLoading, isError } = useGet<StoresResponse>(
    `/stores?limit=${limit}`,
    undefined,
    ADMIN_FRESH
  );

  return {
    stores: data?.data ?? [],
    hasMore: data?.pagination?.hasMore ?? false,
    nextCursor: data?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};