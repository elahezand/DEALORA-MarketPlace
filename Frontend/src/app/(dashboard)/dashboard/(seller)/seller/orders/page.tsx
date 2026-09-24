import { useAuthServerData } from "@/utils/hooks/useServerData";
import MyOrdersPage from "@/app/(dashboard)/components/(seller)/orders/myOrderPage";
import { SellerOrdersResponse } from "@/types/Order";

export const revalidate = 60;

export default async function SellerOrdersPage() {
  const initialOrders = await useAuthServerData<SellerOrdersResponse>(
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