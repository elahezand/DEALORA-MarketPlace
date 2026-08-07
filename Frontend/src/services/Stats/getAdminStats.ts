import { useGet } from "@/utils/hooks/useReactQueryHooks";

interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  pendingStoreVerifications: number;
}

interface GetAdminStatsResponse {
  success: boolean;
  data: AdminStats;
}

export const useGetAdminStats = () => {
  const { data, isLoading, isError } = useGet<GetAdminStatsResponse>(
    "/admin/stats"
  );

  return {
    stats: data?.data ?? null,
    isLoading,
    isError,
  };
};