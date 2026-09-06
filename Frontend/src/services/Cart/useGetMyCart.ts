import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { CartResponse } from "@/types/Cart";

export const useGetMyCart = () => 
  useGet<CartResponse>('/cart/me', undefined, { staleTime: 0 });
