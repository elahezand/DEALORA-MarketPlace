import { getAuthServerData } from "@/utils/serverData";
import OrderDetail from "@/components/dashboard/user/orders/orderDetail";
import { IOrder } from "@/types/Order";

interface OrderDetailResponse {
  success: boolean;
  data: IOrder;
}

export default async function OrderDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAuthServerData<OrderDetailResponse>(`/orders/${id}`);

  return <OrderDetail initialOrder={order?.data ?? null} orderId={id} />;
}
