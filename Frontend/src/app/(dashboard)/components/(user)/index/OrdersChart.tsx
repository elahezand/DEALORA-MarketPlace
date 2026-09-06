"use client";

import { useGetUserStatsTimeseries } from "@/services/Stats/useGetStats";
import AnalyticsAreaChart from "@/app/(dashboard)/components/shared/AnalyticsAreaChart";

export default function OrdersChart() {
  const { timeseries, isLoading } = useGetUserStatsTimeseries(14);

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Your orders — last 14 days</h3>
      </div>
      {isLoading || !timeseries ? (
        <div className="h-[260px] w-full rounded-xl bg-[var(--background-soft)] animate-pulse" />
      ) : (
        <AnalyticsAreaChart labels={timeseries.labels} series={[{ name: "Orders", data: timeseries.orders }]} />
      )}
    </div>
  );
}
