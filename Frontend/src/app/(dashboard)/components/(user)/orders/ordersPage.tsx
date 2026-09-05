"use client";

import { useState } from "react";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";
import { HiOutlineEye } from "react-icons/hi2";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IOrder, OrdersResponse } from "@/types/Order";
import { IPagination } from "@/types/common";
import TableCard from "../../shared/table/TableCard";
import { Th, Badge } from "../../shared/table/TableParts";

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

const filterOptions = [
  { id: "all", label: "All Orders", status: null },
  { id: "created", label: "Created", status: ["created", "pending"] },
  { id: "processing", label: "Processing", status: ["processing"] },
  { id: "shipped", label: "Shipped", status: ["shipped"] },
  { id: "completed", label: "Completed", status: ["completed", "delivered"] },
  { id: "cancelled", label: "Cancelled", status: ["cancelled", "failed"] },
];

interface OrdersPageProps {
  initialData?: IOrder[];
  initialPagination?: IPagination;
}

export default function OrdersPage({
  initialData = [],
  initialPagination,
}: OrdersPageProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<OrdersResponse>(
    "/orders/my",
    {},
    {
      initialData: {
        pages: [{ data: { data: initialData, pagination: initialPagination } }],
        pageParams: [null],
      },
    }
  );

  const allOrders = (
    data?.pages.flatMap((page: OrdersResponse) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const selectedFilterConfig = filterOptions.find(
    (f) => f.id === selectedFilter
  );

  const orders =
    selectedFilterConfig?.status === null
      ? allOrders
      : allOrders.filter((o) =>
          selectedFilterConfig?.status?.includes(o.status?.toLowerCase())
        );

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
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
              selectedFilter === filter.id
                ? "bg-[var(--primary-500)] text-white shadow-lg"
                : "bg-[var(--background-soft)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--card-solid)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Card Structure */}
      <TableCard
        isLoading={isLoading}
        isError={isError}
        isEmpty={orders.length === 0}
        errorMessage="Error fetching orders"
        emptyTitle={
          allOrders.length === 0 ? "No orders yet" : "No orders found"
        }
        emptyMessage={
          allOrders.length === 0
            ? "Start shopping to create your first order"
            : `No orders match the "${selectedFilterConfig?.label}" filter`
        }
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
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}