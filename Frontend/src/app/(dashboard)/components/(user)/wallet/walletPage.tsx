"use client";

import { useState } from "react";
import Link from "next/link";
import { InfiniteData } from "@tanstack/react-query";
import { HiOutlineWallet, HiOutlineArrowDownLeft, HiOutlineArrowUpRight } from "react-icons/hi2";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { WalletResponse, WalletTransaction, WalletTransactionType } from "@/types/Wallet";
import { QueryParams } from "@/types/api/ErrorTypes";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";

const ENDPOINT = "/users/me/wallet";

const TYPE_TABS: { value: WalletTransactionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "refund", label: "Refunds" },
  { value: "spend", label: "Spent" },
];

const money = (n = 0) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

interface WalletPageProps {
  initialData?: InfiniteData<WalletResponse>;
}

export default function WalletPage({ initialData }: WalletPageProps) {
  const [type, setType] = useState<WalletTransactionType | "all">("all");
  const [filters, setFilters] = useState<TableFilterValue>(emptyFilters);

  const params: QueryParams = { limit: 20, ...(type !== "all" && { type }), ...filtersToParams(filters) };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteGet<WalletResponse>(ENDPOINT, params, {
      queryKey: [ENDPOINT, type, filtersKey(filters)],
      initialData: type === "all" && filtersKey(filters) === "{}" ? initialData : undefined,
    });

  const firstPage = data?.pages?.[0];
  const transactions: WalletTransaction[] = (
    data?.pages?.flatMap((page: WalletResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Account</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">My Wallet</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--success-bg)] flex items-center justify-center">
            <HiOutlineWallet className="w-5 h-5 text-[var(--success-500)]" />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--foreground)]">{money(firstPage?.balance)}</p>
            <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Balance</p>
          </div>
        </div>
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5">
          <p className="text-xl font-black text-[var(--success-500)]">+{money(firstPage?.totals?.refunded)}</p>
          <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Total refunded</p>
        </div>
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5">
          <p className="text-xl font-black text-[var(--foreground)]">-{money(firstPage?.totals?.spent)}</p>
          <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Spent on orders</p>
        </div>
      </div>

      <p className="text-sm text-[var(--foreground-muted)] -mt-4">
        Refunds of cancelled orders land here. You can use this balance at checkout.
      </p>

      <TableFilters value={filters} onChange={setFilters} withSearch={false}>
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setType(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${type === tab.value
              ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </TableFilters>

      <TableCard
        header={<WidgetHeader icon={HiOutlineWallet} title="Wallet history" href="/dashboard/wallet" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={transactions.length === 0}
        errorMessage="Could not load your wallet"
        emptyTitle="No wallet activity yet"
        emptyMessage="Refunds and wallet payments will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>Order</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isRefund = tx.type === "refund";
            return (
              <tr key={tx._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {isRefund ? (
                      <HiOutlineArrowDownLeft className="w-4 h-4 text-[var(--success-500)]" />
                    ) : (
                      <HiOutlineArrowUpRight className="w-4 h-4 text-[var(--foreground-muted)]" />
                    )}
                    <Badge tone={isRefund ? "success" : "neutral"} label={isRefund ? "Refund" : "Paid for order"} />
                  </div>
                  {tx.note && <p className="text-xs text-[var(--foreground-subtle)] mt-1">{tx.note}</p>}
                </td>
                <td className={`px-6 py-4 text-sm font-black ${isRefund ? "text-[var(--success-500)]" : "text-[var(--foreground)]"}`}>
                  {isRefund ? "+" : "-"}{money(tx.amount)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {tx.order ? (
                    <Link href={`/dashboard/orders/${tx.order._id}`} className="font-mono text-xs text-[var(--primary-500)] hover:underline">
                      #{tx.order._id.slice(-6).toUpperCase()}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="self-center text-sm font-bold px-5 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background-soft)] disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
