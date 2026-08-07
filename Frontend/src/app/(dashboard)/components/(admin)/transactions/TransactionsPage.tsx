"use client";

import { useState } from "react";
import { HiOutlineCreditCard } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IOrder, OrderStatus } from "@/types/Order";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, ViewAction, Badge } from "../../shared/table/TableParts";

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_TONE: Record<
  OrderStatus,
  "success" | "warning" | "destructive" | "info" | "neutral"
> = {
  created: "neutral",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
};

const PAYMENT_TONE: Record<
  string,
  "success" | "warning" | "destructive" | "neutral"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "neutral",
};

const ENDPOINT = "/orders/admin";

interface TransactionsClientProps {
  initialData?: any;
}

export default function TransactionsClient({
  initialData,
}: TransactionsClientProps) {
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const params = status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, params, { initialData });

  const allOrders: IOrder[] = (
    data?.pages?.flatMap((page: any) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const orders =
    status === "all" ? allOrders : allOrders.filter((o) => o.status === status);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Transactions
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${
              status === tab.value
                ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineCreditCard}
            title="Orders"
            href="/dashboard/admin/transactions"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={orders.length === 0}
        errorMessage="Error fetching orders"
        emptyTitle="No orders"
        emptyMessage="No orders match this filter"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Order</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4">
                <p className="font-bold text-sm text-[var(--foreground)] font-mono">
                  #{order._id.slice(-8).toUpperCase()}
                </p>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                ${(order.pricing?.total ?? 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <Badge
                  tone={STATUS_TONE[order.status] ?? "neutral"}
                  label={order.status}
                />
              </td>
              <td className="px-6 py-4">
                <Badge
                  tone={PAYMENT_TONE[order.paymentStatus] ?? "neutral"}
                  label={order.paymentStatus}
                />
              </td>
              <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                {new Date(order.createdAt).toLocaleDateString("en-US")}
              </td>
              <td className="px-6 py-4 text-right">
                <ViewAction
                  href={`/dashboard/admin/transactions/${order._id}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {hasNextPage && (
        <div className="flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      )}

      {status !== "all" && (
        <p className="text-xs text-[var(--foreground-muted)]">
          Note: filtering happens on the orders already loaded — click "Load
          More" if you don't see all {status} orders yet.
        </p>
      )}
    </div>
  );
}