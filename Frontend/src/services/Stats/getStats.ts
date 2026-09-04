import { useGet } from "@/utils/hooks/useReactQueryHooks";

interface PublicStats {
  activeListings: number;
  activeUsers: number;
  citiesCovered: number;
  successfulDeals: number;
  todayListings: number;
}

interface GetPublicStatsResponse {
  success: boolean;
  data: PublicStats;
}

export const useGetPublicStats = () => {
  const { data, isLoading, isError } = useGet<GetPublicStatsResponse>(
    "/stats"
  );

  return {
    stats: data?.data ?? null,
    isLoading,
    isError,
  };
};
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
    "/stats/admin"
  );
 
  return {
    stats: data?.data ?? null,
    isLoading,
    isError,
  };
};
 