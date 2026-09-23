import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { WalletResponse } from "@/types/Wallet";

export const useGetWallet = () =>
  useInfiniteGet<WalletResponse>("/wallet/me", { limit: 20 }, {
    queryKey: ["wallet-me"],
  });
