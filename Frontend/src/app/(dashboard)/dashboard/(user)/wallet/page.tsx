import { getAuthServerData } from "@/utils/serverData";
import { WalletResponse } from "@/types/Wallet";
import WalletPage from "@/components/dashboard/user/wallet/walletPage";

export default async function WalletPageWrapper() {
  // per user and changes after every refund → never cached
  const initialWallet = await getAuthServerData<WalletResponse>("/users/me/wallet");

  return (
    <WalletPage
      initialData={initialWallet ? { pages: [initialWallet], pageParams: [null] } : undefined}
    />
  );
}
