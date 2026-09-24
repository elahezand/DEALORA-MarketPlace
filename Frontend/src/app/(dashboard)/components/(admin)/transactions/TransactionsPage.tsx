"use client";

import { useState } from "react";
import { HiOutlineCreditCard, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IOrder, OrderStatus, AdminOrdersResponse } from "@/types/Order";
import { QueryParams } from "@/types/api/ErrorTypes";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, ViewAction, Badge } from "../../shared/table/TableParts";
import { useAdminAutoComplete } from "@/services/Order/useAdminAutoComplete";
import { useAdminMarkDelivered } from "@/services/Order/useAdminMarkDelivered";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";

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
  initialData?: InfiniteData<AdminOrdersResponse>;
}

export default function TransactionsClient({
  initialData,
}: TransactionsClientProps) {
  const [filters, setFilters] = useState<TableFilterValue>(emptyFilters);
  const [status, setStatus] = useState<OrderStatus | "all">("processing");
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  // shipped cash orders nobody confirmed in time
  const [overdueCashOnly, setOverdueCashOnly] = useState(false);

  const params: QueryParams = {
    limit: 20,
    ...(status !== "all" ? { status } : {}),
    ...(needsActionOnly ? { needsAdminAction: "true" } : {}),
    ...(overdueCashOnly ? { overdueCash: "true" } : {}),
    ...filtersToParams(filters),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<AdminOrdersResponse>(ENDPOINT, params,
    {
      queryKey: ["admin-orders", status, needsActionOnly, overdueCashOnly, filtersKey(filters)], initialData:
        status === "processing" && !needsActionOnly && !overdueCashOnly && filtersKey(filters) === "{}"
          ? initialData
          : undefined
    }
  );


  const allOrders: (IOrder & { hasPendingAdminItems?: boolean; isCashOverdue?: boolean })[] = (
    data?.pages?.flatMap((page: AdminOrdersResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: runAutoComplete, isPending: isRunningAutoComplete } = useAdminAutoComplete();
  const { mutate: markDelivered, isPending: isMarking, variables: markingId } = useAdminMarkDelivered();


  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Transactions
        </h1>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => runAutoComplete({})}
            disabled={isRunningAutoComplete}
            title="Finish half-done orders, settle unpaid ones and auto-complete orders shipped more than 7 days ago"
            className="text-xs font-bold px-4 py-2 rounded-lg border transition-colors flex items-center gap-1.5 border-[var(--primary-500)]/40 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10 disabled:opacity-50"
          >
            {isRunningAutoComplete ? "Running..." : "Run order checks"}
          </button>

          <button
            type="button"
            onClick={() => setNeedsActionOnly((v) => !v)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${needsActionOnly
                ? "bg-[var(--warning-500)] text-white border-[var(--warning-500)]"
                : "border-[var(--warning-500)]/40 text-[var(--warning-500)] hover:bg-[var(--warning-bg)]"
              }`}
          >
            <HiOutlineExclamationTriangle className="w-4 h-4" />
            Needs My Action
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !overdueCashOnly;
              setOverdueCashOnly(next);
              // overdue cash orders are always "shipped"
              if (next) setStatus("all");
            }}
            title="Cash orders shipped long ago that nobody confirmed — mark them delivered or cancel them"
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${overdueCashOnly
                ? "bg-[var(--destructive)] text-white border-[var(--destructive)]"
                : "border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)]"
              }`}
          >
            Overdue cash
          </button>
        </div>
      </div>

      <TableFilters value={filters} onChange={setFilters} searchPlaceholder="Search order id..." />


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
        isEmpty={allOrders.length === 0}
        errorMessage="Error fetching orders"
        emptyTitle="No orders"
        emptyMessage={
          overdueCashOnly
            ? "No overdue cash orders — every shipped cash order is confirmed"
            : needsActionOnly
              ? "Nothing needs your attention right now"
              : "No orders match this filter"
        }
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
          {allOrders.map((order) => (
            <tr
              key={order._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[var(--foreground)] font-mono">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  {order.isCashOverdue && (
                    <span
                      title="Cash not confirmed — mark delivered or cancel"
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--destructive-bg)] text-[var(--destructive)] whitespace-nowrap"
                    >
                      Cash overdue
                    </span>
                  )}
                  {order.hasPendingAdminItems && (
                    <span
                      title="Contains an item the site needs to ship"
                      className="w-2 h-2 rounded-full bg-[var(--warning-500)] flex-shrink-0"
                    />
                  )}
                </div>
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
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  {order.status === "shipped" && (
                    <button
                      type="button"
                      disabled={isMarking && markingId === order._id}
                      onClick={() => markDelivered(order._id)}
                      title="Buyer received it — complete the order and release the seller's money"
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/40 text-[var(--success-500)] hover:bg-[var(--success-bg)] disabled:opacity-50 whitespace-nowrap"
                    >
                      {isMarking && markingId === order._id ? "Saving..." : "Mark delivered"}
                    </button>
                  )}
                  <ViewAction href={`/dashboard/admin/transactions/${order._id}`} />
                </div>
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
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""
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