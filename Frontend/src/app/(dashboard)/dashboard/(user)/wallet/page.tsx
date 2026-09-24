import { useAuthServerData } from "@/utils/hooks/useServerData";
import { WalletResponse } from "@/types/Wallet";
import WalletPage from "@/app/(dashboard)/components/(user)/wallet/walletPage";

export default async function WalletPageWrapper() {
  // per user and changes after every refund → never cached
  const initialWallet = await useAuthServerData<WalletResponse>("/users/me/wallet");

  return (
    <WalletPage
      initialData={initialWallet ? { pages: [initialWallet], pageParams: [null] } : undefined}
    />
  );
}
