import { getAuthServerData } from "@/utils/serverData";
import WithdrawalsClient from "@/components/dashboard/admin/withdrawals/WithdrawalsPage";
import { WithdrawalsResponse } from "@/types/Withdrawal";
export const revalidate = 60;

export default async function AdminWithdrawalsPage() {
  const initialWithdrawals = await getAuthServerData<WithdrawalsResponse>(
    "/withdrawals/admin?status=pending",
  );

  return (
    <WithdrawalsClient
      initialData={
        initialWithdrawals
          ? { pages: [initialWithdrawals], pageParams: [null] }
          : undefined
      }
    />
  );
}