import { ApiMessageResponse } from "@/types/common";
import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";



export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useDelete<ApiMessageResponse, { productId: string }>(
    (data) => `/wishList/${data.productId}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user-wishlist"] });
        toast.success("Removed from favorites.");
      },
      errorFallback: "Failed to remove from favorites.",
    }
  );
};