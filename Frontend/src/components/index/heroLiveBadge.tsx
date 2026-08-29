"use client";

import { useGetPublicStats } from "@/services/Stats/getStats";
export default function HeroLiveBadge() {
  const { stats, isLoading, isError } = useGetPublicStats();

  const label =
    !isLoading && !isError && stats?.todayListings
      ? `${new Intl.NumberFormat("en-US").format(stats.todayListings)}+ items listed today`
      : "New listings added every day";

  return (
    <div
      className="
        inline-flex items-center gap-2
        px-4 py-1.5
        rounded-full
        text-xs font-semibold
        bg-primary-50 dark:bg-primary-950/60
        border border-primary-200 dark:border-primary-800
        text-primary-700 dark:text-primary-300
        backdrop-blur-md
        shadow-sm shadow-primary-900/5
      "
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-primary-600 dark:bg-primary-400" />
      </span>
      {label}
    </div>
  );
}