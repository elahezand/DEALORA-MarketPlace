import { useQueryClient } from "@tanstack/react-query";
import { useGet, usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

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

/* PUBLIC — list of verified stores (e.g. homepage) */
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

/* ADMIN — toggle a store's verified status */
const ENDPOINT = "/stores";

export const useVerifyStore = () => {
  const queryClient = useQueryClient();

  return usePatch<any, { id: string; isVerified: boolean }>(
    (d) => `${ENDPOINT}/${d.id}/verify`,
    {
      onSuccess: (res) => {
        toast.success(res?.message || "Store updated");
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      },
      errorFallback: "Action failed",
    }
  );
};
