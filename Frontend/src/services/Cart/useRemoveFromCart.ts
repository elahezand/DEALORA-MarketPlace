import {  useDelete} from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useDelete((data: { offerId: string }) => `/cart/me/items/${data.offerId}`, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
    errorFallback: "Couldn't remove this item",
  });
};
