import { useGet } from "@/utils/hooks/useReactQueryHooks";
export interface IOrder {
  _id: string;
  user: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface PaginateResult<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface GetOrdersAdminResponse {
  success: boolean;
  data: PaginateResult<IOrder>;
}

export const useGetOrdersAdmin = (limit = 5) => {
  const { data, isLoading, isError } = useGet<GetOrdersAdminResponse>(
    `/orders/admin?limit=${limit}`
  );
  return {
    orders: data?.data?.data ?? [],
    hasMore: data?.data?.pagination?.hasMore ?? false,
    nextCursor: data?.data?.pagination?.nextCursor ?? null,
    isLoading,
    isError,
  };
};