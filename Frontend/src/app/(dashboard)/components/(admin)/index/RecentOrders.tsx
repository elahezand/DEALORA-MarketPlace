"use client";

import { HiOutlineShoppingBag } from "react-icons/hi2";
import { useGetOrdersAdmin } from "@/services/Order/useGetOrders";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, ViewAction, Badge } from "../../shared/table/TableParts";
import { IOrder, OrderStatus } from "@/types/Order";

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "destructive" | "info" | "neutral"> = {
  created: "neutral",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
};

export default function RecentOrders() {
  const { orders = [], isLoading, isError } = useGetOrdersAdmin(5);

  return (
    <TableCard
      header={
        <WidgetHeader
          icon={HiOutlineShoppingBag}
          title="Recent Orders"
          showViewAll={true}
          href="/dashboard/admin/transactions"
        />
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={orders.length === 0}
      errorMessage="Error fetching orders"
      emptyTitle="No orders yet"
      emptyMessage="New orders will show up here"
    >
      <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
        <tr>
          <Th>Order</Th>
          <Th>Total</Th>
          <Th>Status</Th>
          <Th>Date</Th>
          <Th align="right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order: IOrder) => {
          const status = (order?.status as OrderStatus) ?? "created";
          const tone = STATUS_TONE[status] ?? "neutral";
          const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";

          return (
            <tr
              key={order._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4">
                <p className="font-bold text-sm text-[var(--foreground)]">
                  #{order._id ? order._id.slice(-6).toUpperCase() : "—"}
                </p>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                {new Intl.NumberFormat("en-US").format(order.pricing?.total ?? 0)} Toman
              </td>
              <td className="px-6 py-4">
                <Badge tone={tone} label={label} />
              </td>
              <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US") : "—"}
              </td>
              <td className="px-6 py-4 text-right">
                <ViewAction href={`/dashboard/admin/transactions/${order._id}`} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableCard>
  );
}