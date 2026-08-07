"use client";

import { HiOutlineShoppingBag } from "react-icons/hi2";
import { OrderStatus, IOrder } from "@/types/Order";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";

interface RecentOrdersProps {
  initialData?: IOrder[];
}

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "destructive" | "neutral" | "info"> = {
  created: "neutral",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
};

export default function RecentOrders({ initialData = [] }: RecentOrdersProps) {
  return (
    <TableCard
      header={
        <WidgetHeader
          icon={HiOutlineShoppingBag}
          title="Recent Orders"
          showViewAll={true}
          href="/dashboard/orders"
        />
      }
      isLoading={false}
      isError={false}
      isEmpty={initialData.length === 0}
      emptyTitle="No orders yet"
      emptyMessage="Your orders will show up here"
    >
      <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
        <tr>
          <Th>Order</Th>
          <Th>Status</Th>
          <Th align="right">Total</Th>
        </tr>
      </thead>
      <tbody>
        {initialData.map((order) => {
          const displayTitle =
            order.items?.[0]?.product || `Order #${order._id.slice(-6).toUpperCase()}`;

          return (
            <tr
              key={order._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl cat-icon-sand flex items-center justify-center flex-shrink-0">
                    <HiOutlineShoppingBag className="w-4 h-4 text-[var(--foreground-muted)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">
                      {displayTitle}
                    </p>
                    <p className="text-[11px] text-[var(--foreground-subtle)]">
                      #{order._id.slice(-6).toUpperCase()} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge tone={STATUS_TONE[order.status] ?? "neutral"} label={order.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-black text-[var(--foreground)]">
                  ${order.pricing?.total?.toLocaleString() ?? 0}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableCard>
  );
}