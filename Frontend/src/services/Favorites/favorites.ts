import { useQueryClient } from "@tanstack/react-query";
import { useGet, usePatch, useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export const useIsFavorited = (productId?: string) =>
  useGet<{ isFavorited: boolean }>(
    `/wishList/is-favorited/${productId}`,
    undefined,
    { enabled: !!productId, silentError: true }
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

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useDelete<any, { productId: string }>(
    (data) => `/wishList/${data.productId}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/wishList/my"] });
        toast.success("Removed from favorites.");
      },
      errorFallback: "Failed to remove from favorites.",
    }
  );
};