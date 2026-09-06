import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";



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