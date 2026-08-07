import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { IStore } from "@/types/User";
interface PaginateResult<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface GetStoresResponse {
  stores: PaginateResult<IStore>;
}

export const useGetStores = (limit = 5) => {
  const { data, isLoading, isError } = useGet<GetStoresResponse>(
    `/stores?limit=${limit}`
  );

  return {
    stores: data?.stores?.data ?? [],
    hasMore: data?.stores?.pagination?.hasMore ?? false,
    nextCursor: data?.stores?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};