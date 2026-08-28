import { useGet } from "@/utils/hooks/useReactQueryHooks";

interface VerifiedStore {
  _id: string;
  name: string;
  slug: string;
  logo: string | null;
  address?: { city?: string | null };
  meta?: { ratings?: number; reviewsCount?: number };
}

interface GetVerifiedStoresResponse {
  success: boolean;
  data: VerifiedStore[];
}

export const useGetVerifiedStores = () => {
  const { data, isLoading, isError } = useGet<GetVerifiedStoresResponse>(
    "/stores/verified"
  );

  return {
    stores: data?.data ?? [],
    isLoading,
    isError,
  };
};