"use client";

import {
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingBag,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useGetAdminStats } from "@/services/Stats/getAdminStats";

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

export default function Stats() {
  const { stats, isLoading, isError } = useGetAdminStats();

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
              <Icon className="w-4 h-4 text-[var(--primary-400)]" />
            </div>
            <p className="menu-section-title mb-1">{card.label}</p>
            <p className="text-xl font-black text-[var(--foreground)]">
              {new Intl.NumberFormat("en-US").format(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}