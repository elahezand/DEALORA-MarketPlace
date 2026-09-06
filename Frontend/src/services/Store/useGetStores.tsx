import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { StoresResponse } from "@/types/Store";

export const useGetStores = (limit = 5) => {
  const { data, isLoading, isError } = useGet<StoresResponse>(
    `/stores?limit=${limit}`
  );

  return {
    stores: data?.data?.data ?? [],
    hasMore: data?.data?.pagination?.hasMore ?? false,
    nextCursor: data?.data?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};