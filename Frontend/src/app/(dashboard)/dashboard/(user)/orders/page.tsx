import { useAuthServerData } from "@/utils/hooks/useServerData";
import { OrdersResponse } from "@/types/Order";
import OrdersPage from "@/app/(dashboard)/components/(user)/orders/ordersPage";
export const revalidate = 60;

export default async function OrdersPageWrapper() {
   const data = await useAuthServerData<OrdersResponse>("/orders/my"); 
  return (
    <OrdersPage
      initialData={data?.data?.data || []}
      initialPagination={data?.data?.pagination}
    />
  );
}