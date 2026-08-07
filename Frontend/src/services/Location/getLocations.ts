import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { LocationsPayload } from "@/types/Location";

export const useLocation = () => {
  const { data, isLoading, error } = useGet<LocationsPayload>(
    "/locations",
    undefined,
    {
      axiosConfig: { skipRefresh: true },
      queryKey: ["Locations"]
    }
  );
  return { data, isLoading, error };
};