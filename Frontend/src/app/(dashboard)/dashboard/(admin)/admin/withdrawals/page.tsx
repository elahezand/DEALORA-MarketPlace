import { useAuthServerData } from "@/utils/hooks/useServerData";
import WithdrawalsClient from "@/app/(dashboard)/components/(admin)/withdrawals/WithdrawalsPage";
import { WithdrawalsResponse } from "@/types/Withdrawal";
export const revalidate = 60;

export default async function AdminWithdrawalsPage() {
  const initialWithdrawals = await useAuthServerData<WithdrawalsResponse>(
    "/withdrawals/admin?status=processing",
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