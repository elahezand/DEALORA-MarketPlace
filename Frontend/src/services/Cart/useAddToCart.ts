import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return usePost('/cart/me/items', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/cart/me'] });
      toast.success("Added to cart");
    },
    errorFallback: "Couldn't add this item to the cart",
  });
};