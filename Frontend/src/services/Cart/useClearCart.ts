import {useDelete } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useDelete(() => '/cart/me', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/cart/me'] }),
    errorFallback: "Couldn't clear the cart",
  });
};
