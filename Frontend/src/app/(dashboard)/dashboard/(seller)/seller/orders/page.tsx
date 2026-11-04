import { getAuthServerData } from "@/utils/serverData";
import MyOrdersPage from "@/components/dashboard/seller/orders/myOrderPage";
import { SellerOrdersResponse } from "@/types/Order";

export const revalidate = 60;

export default async function SellerOrdersPage() {
  const initialOrders = await getAuthServerData<SellerOrdersResponse>(
    "/orders/seller?limit=20&status=processing",
  );

  return (
    <MyOrdersPage
      initialData={
        initialOrders
          ? { pages: [initialOrders], pageParams: [null] }
          : undefined
      }
    />
  );
}