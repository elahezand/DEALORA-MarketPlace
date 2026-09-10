import { useGet } from "@/utils/hooks/useReactQueryHooks";

export const useIsFavorited = (productId?: string) =>
  useGet<{ success: boolean; data: { isFavorited: boolean } }>(
    `/wishList/is-favorited/${productId}`,
    undefined,
    { enabled: !!productId, silentError: true, axiosConfig: { silentAuth: true } }
  );