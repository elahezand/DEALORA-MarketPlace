"use client";

import { MotionDiv } from "../../utils/providers/MotionWrapper";
import { useGetPublicStats } from "@/services/Stats/getStats";
const LABELS = [
  { key: "activeListings", label: "Active Listings" },
  { key: "activeUsers", label: "Active Users" },
  { key: "citiesCovered", label: "Cities Covered" },
  { key: "successfulDeals", label: "Successful Deals" },
] as const;

function formatStat(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)}+`;
}

export default function StatsBar() {
  const { stats, isLoading, isError } = useGetPublicStats();  
  return (
    <MotionDiv
      initial={{ y: 15, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="
        grid grid-cols-2 sm:grid-cols-4
        gap-4 sm:gap-6
        rounded-[calc(var(--radius)+8px)]
        border border-[var(--border)]
        bg-[var(--card-solid)]
        p-6 sm:p-8
        shadow-sm
      "
    >
      {LABELS.map((item, i) => {
        const rawValue = stats?.[item.key];
        const display =
          !isLoading && !isError && typeof rawValue === "number"
            ? formatStat(rawValue)
            : null;

        return (
          <div
            key={item.key}
            className="flex flex-col items-center text-center gap-1 sm:border-r sm:last:border-r-0 border-[var(--border)]"
          >
            {display ? (
              <span className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight">
                {display}
              </span>
            ) : (
              <span className="h-7 sm:h-9 w-16 rounded bg-[var(--border-strong)]/30 animate-pulse" />
            )}
            <span className="text-xs sm:text-sm text-[var(--foreground-muted)] font-medium">
              {item.label}
            </span>
          </div>
        );
      })}
    </MotionDiv>
  );
}