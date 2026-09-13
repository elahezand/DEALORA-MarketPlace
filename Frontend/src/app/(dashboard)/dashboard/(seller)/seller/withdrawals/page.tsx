import { useAuthServerData } from "@/utils/hooks/useServerData";
import { WithdrawalsResponse } from "@/types/Withdrawal";
import WithdrawalsPage from "@/app/(dashboard)/components/(seller)/Withdrawals/withdrawlsPage";

export default async function SellerWithdrawalsRoute() {
  const initialWithdrawals = await useAuthServerData<WithdrawalsResponse>(
    "/withdrawals/mine",
  );

  return (
    <WithdrawalsPage
      initialData={
        initialWithdrawals
          ? { pages: [initialWithdrawals], pageParams: [null] }
          : undefined
      }
    />
  );
}