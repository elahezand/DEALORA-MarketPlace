import { useAuthServerData } from "@/utils/hooks/useServerData";
import TransactionsClient from "@/app/(dashboard)/components/(admin)/transactions/TransactionsPage";
export default async function AdminTransactionsPage() {
  const initialOrders = await useAuthServerData<any>(
    "/orders/admin?limit=20",
    "admin-transactions",
    60 * 5
  );

  return (
    <TransactionsClient
   initialData={
        initialOrders
          ? { pages: [initialOrders], pageParams: [1] }
          : undefined
      }    />
  );
}