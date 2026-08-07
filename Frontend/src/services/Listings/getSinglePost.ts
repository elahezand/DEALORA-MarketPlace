import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ListingTypeResponse } from "@/types/Listings";

export const useGetPost = (id: string) =>
  useGet<ListingTypeResponse>(
    `/listings/${id}`,
    undefined,
    {
      queryKey: ["listing", id],
      enabled: !!id,
    }
  );

  