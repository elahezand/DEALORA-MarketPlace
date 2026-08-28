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