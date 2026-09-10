"use client";

import { useState } from "react";
import {
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingBag,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useGetAdminStats, useGetAdminStatsTimeseries } from "@/services/Stats/useGetStats";
import DonutChart from "../shared/AnalyticsAreaChart";
import MiniCalendar from "../../shared/MiniCalendar";
const STAT_CARDS: {
  key: keyof NonNullable<ReturnType<typeof useGetAdminStats>["stats"]>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  highlightIfPositive?: boolean;
}[] = [
  { key: "totalUsers", label: "Total Users", icon: HiOutlineUsers, iconBg: "cat-icon-blue" },
  { key: "totalStores", label: "Total Stores", icon: HiOutlineBuildingStorefront, iconBg: "cat-icon-teal" },
  { key: "totalOrders", label: "Total Orders", icon: HiOutlineShoppingBag, iconBg: "cat-icon-sand" },
  {
    key: "pendingStoreVerifications",
    label: "Pending Verifications",
    icon: HiOutlineExclamationTriangle,
    iconBg: "cat-icon-amber",
    highlightIfPositive: true,
  },
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

export default function Stats() {
  const { stats, isLoading, isError } = useGetAdminStats();
  const [range, setRange] = useState<typeof RANGE_OPTIONS[number]>(30);
  const { timeseries, isLoading: isLoadingChart } = useGetAdminStatsTimeseries(range);

  if (isError) {
    return (
      <div className="rounded-2xl border border-[var(--destructive-bg)] bg-[var(--destructive-bg)] p-4 text-sm text-[var(--destructive)]">
        Error fetching stats
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
          const isHighlighted = card.highlightIfPositive && value > 0;

          return (
            <div
              key={card.key}
              className={
                "card rounded-2xl border p-4 " +
                (isHighlighted
                  ? "border-[var(--warning-500)] bg-[var(--warning-bg)]"
                  : "border-[var(--border)] bg-[var(--card-solid)]")
              }
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                <Icon className="w-6 h-6 text-[var(--primary-400)]" />
              </div>
              <p className="text-sm md:!text-[14px] xl:!text-[16px] mb-1">{card.label}</p>
              <p className="text-xl font-black text-[var(--foreground)]">
                {new Intl.NumberFormat("en-US").format(value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card max-h-[380px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Orders vs new users</h3>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value) as typeof RANGE_OPTIONS[number])}
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
            <div className="h-[150px] w-full rounded-xl bg-[var(--background-soft)] animate-pulse" />
          ) : (
            <DonutChart
              height={200}
              labels={["Orders", "New users"]}
              series={[
                timeseries.orders.reduce((a, b) => a + b, 0),
                (timeseries.newUsers ?? []).reduce((a, b) => a + b, 0),
              ]}
            />
          )}
        </div>

        <MiniCalendar compact className="max-h-[380px] overflow-hidden" />
      </div>
    </div>
  );
}