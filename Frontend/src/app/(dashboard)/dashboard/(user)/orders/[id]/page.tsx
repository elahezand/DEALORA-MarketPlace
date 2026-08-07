import { useAuthServerData } from "@/utils/hooks/useServerData";
import OrderDetail from "@/app/(dashboard)/components/(user)/orders/orderDetail";
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
  const order = await useAuthServerData<OrderDetailResponse>(`/orders/${id}`);

  return <OrderDetail initialOrder={order?.data ?? null} orderId={id} />;
}
