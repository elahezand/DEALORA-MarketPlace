import { getAuthServerData } from "@/utils/serverData";
import { WithdrawalsResponse } from "@/types/Withdrawal";
import WithdrawalsPage from "@/components/dashboard/seller/Withdrawals/withdrawlsPage";

export default async function SellerWithdrawalsRoute() {
  const initialWithdrawals = await getAuthServerData<WithdrawalsResponse>(
    "/withdrawals/mine?status=processing",
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