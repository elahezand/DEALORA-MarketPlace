"use client";

import {
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingBag,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { useGetAdminStats } from "@/services/Stats/getStats";
export default function AnalyticsPage() {
  const { stats, isLoading, isError } = useGetAdminStats();

  const cards = stats
    ? [
        {
          label: "Total Users",
          value: stats.totalUsers,
          icon: HiOutlineUsers,
          iconBg: "cat-icon-blue",
        },
        {
          label: "Total Stores",
          value: stats.totalStores,
          icon: HiOutlineBuildingStorefront,
          iconBg: "cat-icon-teal",
        },
        {
          label: "Total Orders",
          value: stats.totalOrders,
          icon: HiOutlineShoppingBag,
          iconBg: "cat-icon-sand",
        },
        {
          label: "Pending Store Verifications",
          value: stats.pendingStoreVerifications,
          icon: HiOutlineExclamationTriangle,
          iconBg: "cat-icon-amber",
          highlight: stats.pendingStoreVerifications > 0,
        },
      ]
    : [];

  const verifiedStores = stats ? stats.totalStores - stats.pendingStoreVerifications : 0;
  const verifiedRate =
    stats && stats.totalStores > 0
      ? Math.round((verifiedStores / stats.totalStores) * 100)
      : null;
  const ordersPerUser =
    stats && stats.totalUsers > 0 ? (stats.totalOrders / stats.totalUsers).toFixed(2) : null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Analytics
        </h1>
      </div>

      {isError && (
        <div className="rounded-2xl border border-[var(--destructive-bg)] bg-[var(--destructive-bg)] p-4 text-sm text-[var(--destructive)]">
          Error fetching stats
        </div>
      )}

      {(isLoading || !stats) && !isError ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 animate-pulse"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--background-soft)] mb-3" />
              <div className="h-3 w-20 bg-[var(--background-soft)] rounded mb-3" />
              <div className="h-6 w-14 bg-[var(--background-soft)] rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={
                    "card rounded-2xl border p-4 " +
                    (card.highlight
                      ? "border-[var(--warning-500)] bg-[var(--warning-bg)]"
                      : "border-[var(--border)] bg-[var(--card-solid)]")
                  }
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                    <Icon className="w-4 h-4 text-[var(--primary-400)]" />
                  </div>
                  <p className="menu-section-title mb-1">{card.label}</p>
                  <p className="text-xl font-black text-[var(--foreground)]">
                    {new Intl.NumberFormat("en-US").format(card.value)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Simple derived ratios — computed client-side from the same 4 numbers, not extra backend data */}
          <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <HiOutlineChartBar className="w-5 h-5 text-[var(--foreground-muted)]" />
              <span className="font-bold text-[var(--foreground)] text-sm">At a glance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--foreground-muted)]">Store verification rate</span>
                <span className="font-bold text-[var(--foreground)]">
                  {verifiedRate !== null ? `${verifiedRate}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--foreground-muted)]">Orders per user</span>
                <span className="font-bold text-[var(--foreground)]">{ordersPerUser ?? "—"}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--foreground-muted)]">
            This is everything the backend's <code>/admin/stats</code> endpoint currently exposes —
            totals only, no time-series or revenue breakdown yet. Deeper analytics (growth over
            time, revenue trends, category breakdowns) would need new backend endpoints.
          </p>
        </>
      ) : null}
    </div>
  );
}
