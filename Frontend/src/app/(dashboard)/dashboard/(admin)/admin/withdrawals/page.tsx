import { useAuthServerData } from "@/utils/hooks/useServerData";
import WithdrawalsClient from "@/app/(dashboard)/components/(admin)/withdrawals/WithdrawalsPage";
import { WithdrawalsResponse } from "@/types/Withdrawal";

export default async function AdminWithdrawalsPage() {
  const initialWithdrawals = await useAuthServerData<WithdrawalsResponse>(
    "/withdrawals/admin?limit=20&status=pending",
    "admin-withdrawals",
    60 * 5
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