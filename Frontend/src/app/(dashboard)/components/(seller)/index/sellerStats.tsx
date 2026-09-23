"use client";

import { useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineShoppingBag,
  HiOutlineWallet,
  HiOutlineTag,
  HiOutlineClock,
} from "react-icons/hi2";
import { useGetSellerStats, useGetSellerStatsTimeseries } from "@/services/Stats/useGetStats";
import SalesAreaChart from "../shared/SalesAreaChart";

const STAT_CARDS: {
  key: keyof NonNullable<ReturnType<typeof useGetSellerStats>["stats"]>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  isCurrency?: boolean;
}[] = [
  { key: "totalRevenue", label: "Total Revenue", icon: HiOutlineBanknotes, iconBg: "cat-icon-teal", isCurrency: true },
  { key: "totalOrders", label: "Total Orders", icon: HiOutlineShoppingBag, iconBg: "cat-icon-sand" },
  { key: "walletBalance", label: "Available Balance", icon: HiOutlineWallet, iconBg: "cat-icon-blue", isCurrency: true },
  { key: "walletPending", label: "Pending (until delivery)", icon: HiOutlineClock, iconBg: "cat-icon-amber", isCurrency: true },
  { key: "pendingOffers", label: "Pending Offers", icon: HiOutlineTag, iconBg: "cat-icon-amber" },
];

function StatCardSkeleton() {
  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-[var(--background-soft)] mb-3" />
      <div className="h-3 w-20 bg-[var(--background-soft)] rounded mb-3" />
      <div className="h-6 w-14 bg-[var(--background-soft)] rounded" />
    </div>
  );
}

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

export default function SellerStats() {
  const { stats, isLoading, isError } = useGetSellerStats();
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const { timeseries, isLoading: isLoadingChart } = useGetSellerStatsTimeseries(range);

  if (isError) {
    return (
      <div className="rounded-2xl border border-[var(--destructive-bg)] bg-[var(--destructive-bg)] p-4 text-sm text-[var(--destructive)]">
        Error fetching your store's stats
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <StatCardSkeleton key={c.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key];

          return (
            <div
              key={card.key}
              className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                <Icon className="w-5 h-5 text-[var(--primary-400)]" />
              </div>
              <p className="text-sm md:!text-[14px] xl:!text-[16px] mb-1">{card.label}</p>
              <p className="text-xl font-black text-[var(--foreground)]">
                {card.isCurrency ? "$" : ""}
                {new Intl.NumberFormat("en-US").format(value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Sales over time</h3>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as (typeof RANGE_OPTIONS)[number])}
            className="text-[11px] font-semibold text-[var(--foreground-muted)] bg-transparent border border-[var(--border)] rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--ring)] cursor-pointer"
          >
            {RANGE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </div>
        {isLoadingChart || !timeseries ? (
          <div className="h-[300px] w-full rounded-xl bg-[var(--background-soft)] animate-pulse" />
        ) : (
          <SalesAreaChart
            labels={timeseries.labels}
            revenue={timeseries.revenue}
            orders={timeseries.orders}
          />
        )}
      </div>
    </div>
  );
}