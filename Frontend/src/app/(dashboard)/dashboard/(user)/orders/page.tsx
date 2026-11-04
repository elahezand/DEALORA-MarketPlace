import { getAuthServerData } from "@/utils/serverData";
import { OrdersResponse } from "@/types/Order";
import OrdersPage from "@/components/dashboard/user/orders/ordersPage";
export const revalidate = 60;

export default async function OrdersPageWrapper() {
  const initialOrders = await getAuthServerData<OrdersResponse>("/orders/my?status=processing");
  return (
    <OrdersPage
      initialData={
        initialOrders ? { pages: [initialOrders], pageParams: [null] } : undefined
      } />
  );
}