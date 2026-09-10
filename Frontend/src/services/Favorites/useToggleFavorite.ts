import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";


export const useToggleFavorite = (productId?: string) => {
  const queryClient = useQueryClient();
  return usePatch<{ success: boolean; data: { isFavorited: boolean } }, { productType: "user_ad" | "store_product" }>(
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
