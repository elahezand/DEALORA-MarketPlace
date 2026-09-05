import { useAuthServerData } from "@/utils/hooks/useServerData";
import TransactionsClient from "@/app/(dashboard)/components/(admin)/transactions/TransactionsPage";
import { AdminOrdersResponse } from "@/types/Order";

export default async function AdminTransactionsPage() {
  const initialOrders = await useAuthServerData<AdminOrdersResponse>(
    "/orders/admin?limit=20",
    "admin-transactions",
    60 * 5
  );

  return (
    <TransactionsClient
   initialData={
        initialOrders
          ? { pages: [initialOrders], pageParams: [null] }
          : undefined
      }    />
  );
}