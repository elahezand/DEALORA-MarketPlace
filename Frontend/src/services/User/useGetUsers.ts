import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { IUser } from "@/types/User";

interface PaginateResult<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const useGetUsers = (limit = 5) => {
  const { data, isLoading, isError } = useGet<PaginateResult<IUser>>(
    `/users?limit=${limit}`
  );

  return {
    users: data?.data ?? [],
    hasMore: data?.pagination?.hasMore ?? false,
    nextCursor: data?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};