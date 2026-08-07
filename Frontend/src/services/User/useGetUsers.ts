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

interface GetUsersResponse {
  users: PaginateResult<IUser>;
}

export const useGetUsers = (limit = 5) => {
  const { data, isLoading, isError } = useGet<GetUsersResponse>(
    `/users?limit=${limit}`
  );

  return {
    users: data?.users?.data ?? [],
    hasMore: data?.users?.pagination?.hasMore ?? false,
    nextCursor: data?.users?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};