import { getAuthServerData } from "@/utils/serverData";
import TransactionsClient from "@/components/dashboard/admin/transactions/TransactionsPage";
import { AdminOrdersResponse } from "@/types/Order";
export default async function AdminTransactionsPage() {
  const initialOrders = await getAuthServerData<AdminOrdersResponse>(
    "/orders/admin?status=processing",
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