import { useQueryClient } from "@tanstack/react-query";
import { useGet, usePatch } from "@/utils/hooks/useReactQueryHooks";

export const useIsFavorited = (productId?: string) =>
  useGet<{ isFavorited: boolean }>(
    `/wishList/is-favorited/${productId}`,
    undefined,
    { enabled: !!productId }
  );

export const useToggleFavorite = (productId?: string) => {
  const queryClient = useQueryClient();
  return usePatch<{ isFavorited: boolean }, { productType: "user_ad" | "store_product" }>(
    () => `/wishList/${productId}/toggle`,
    {
      onSuccess: () => {
        if (productId) {
          queryClient.invalidateQueries({ queryKey: [`/wishList/is-favorited/${productId}`] });
        }
        queryClient.invalidateQueries({ queryKey: ["/wishList/my"] });
      },
    }
  );
};