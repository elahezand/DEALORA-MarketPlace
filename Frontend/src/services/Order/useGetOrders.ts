import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { AdminOrdersResponse } from "@/types/Order";

export const useGetOrdersAdmin = (limit = 5) => {
  const { data, isLoading, isError } = useGet<AdminOrdersResponse>(
    `/orders/admin?limit=${limit}`
  );
  return {
    orders: data?.data ?? [],
    hasMore: data?.pagination?.hasMore ?? false,
    nextCursor: data?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};