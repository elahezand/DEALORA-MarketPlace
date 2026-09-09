import { useAuthServerData } from "@/utils/hooks/useServerData";
import { OrdersResponse } from "@/types/Order";
import OrdersPage from "@/app/(dashboard)/components/(user)/orders/ordersPage";
export const revalidate = 60;

export default async function OrdersPageWrapper() {
  const initialOrders = await useAuthServerData<OrdersResponse>("/orders/my?status=processing");
  return (
    <OrdersPage
      initialData={
        initialOrders ? { pages: [initialOrders], pageParams: [null] } : undefined
      } />
  );
}