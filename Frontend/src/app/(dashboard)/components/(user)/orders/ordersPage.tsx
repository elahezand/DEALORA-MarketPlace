"use client";

import { useState } from "react";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";
import { HiOutlineEye } from "react-icons/hi2";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { OrdersResponse, OrderStatus } from "@/types/Order";
import { InfiniteData } from "@tanstack/react-query";
import TableCard from "../../shared/table/TableCard";
import { Th, Badge } from "../../shared/table/TableParts";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import {
  HiOutlineChatBubbleLeftRight
} from "react-icons/hi2";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";
type ToneType = "success" | "warning" | "destructive" | "neutral" | "info";

const STATUS_TONE: Record<string, ToneType> = {
  created: "warning",
  pending: "warning",
  processing: "warning",
  shipped: "info",
  delivered: "success",
  completed: "success",
  cancelled: "destructive",
  failed: "destructive",
};

const PAYMENT_STATUS_TONE: Record<string, ToneType> = {
  pending: "warning",
  unpaid: "warning",
  paid: "success",
  completed: "success",
  failed: "destructive",
  cancelled: "destructive",
  refunded: "neutral",
};

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "created", label: "Created" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface OrdersPageProps {
  initialData?: InfiniteData<OrdersResponse>;
}

export default function OrdersPage({
  initialData,
}: OrdersPageProps) {
  const [filters, setFilters] = useState<TableFilterValue>(emptyFilters);
  const [status, setStatus] = useState<OrderStatus | "all">("processing");
  const params = { limit: 20, ...(status !== "all" && { status }), ...filtersToParams(filters) };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<OrdersResponse>(
    "/orders/my",
    params,
    {
      queryKey: ["/orders/my", status, filtersKey(filters)],
      initialData: status === "processing" && filtersKey(filters) === "{}" ? initialData : undefined
    })



  const orders = (
    data?.pages.flatMap((page: OrdersResponse) => page?.data ?? []) || []
  ).filter(Boolean);



  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Orders</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            My Orders
          </h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${status === tab.value
              ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card Structure */}
      {/* Table Container */}
      <TableFilters value={filters} onChange={setFilters} searchPlaceholder="Search order id..." />

      <TableCard
        header={<WidgetHeader
          icon={HiOutlineChatBubbleLeftRight} title="Orders" href="/dashboard/orders" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={orders.length === 0}
        errorMessage="Error fetching orders"
        emptyTitle="Nothing here"
        emptyMessage={`No ${status === "all" ? "" : status} Orders right now`}
      >

        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Order ID</Th>
            <Th>Items</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            if (!order) return null;
            const orderStatusKey = order.status?.toLowerCase() || "created";
            const orderTone: ToneType = STATUS_TONE[orderStatusKey] || "neutral";

            const paymentStatusKey = order.paymentStatus?.toLowerCase() || "pending";
            const paymentTone: ToneType = PAYMENT_STATUS_TONE[paymentStatusKey] || "neutral";

            const itemsCount = order?.items?.length || 0;

            return (
              <tr
                key={order._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                {/* Order ID & Date */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)] font-mono">
                      {order._id ? order._id.slice(-8).toUpperCase() : "N/A"}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {order.createdAt ? formatDate(order.createdAt) : ""}
                    </p>
                  </div>
                </td>

                {/* Items */}
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  {itemsCount} {itemsCount === 1 ? "item" : "items"}
                </td>

                {/* Total */}
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-[var(--foreground)]">
                    ${(order?.pricing?.total || 0).toLocaleString()}
                  </p>
                  {(order?.pricing?.discount ?? 0) > 0 && (
                    <p className="text-xs text-[var(--success-500)]">
                      -${(order?.pricing?.discount || 0).toLocaleString()} discount
                    </p>
                  )}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  <Badge tone={orderTone} label={order.status || "Created"} />
                </td>

                {/* Payment Badge */}
                <td className="px-6 py-4">
                  <Badge tone={paymentTone} label={order.paymentStatus || "Pending"} />
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="p-2 hover:bg-[var(--background-soft)] rounded-lg transition-colors"
                      title="View Details"
                    >
                      <HiOutlineEye className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div className="p-4 flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : "group-hover:translate-x-0.5"
                }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}