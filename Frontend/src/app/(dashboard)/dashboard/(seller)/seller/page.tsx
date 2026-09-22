"use client";

import Link from "next/link";
import {
  HiOutlineBuildingStorefront,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineClipboardDocumentList,
  HiOutlineBanknotes,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/useGetProfile";
import SellerStats from "@/app/(dashboard)/components/(seller)/index/sellerStats";
const COMING_SOON_LINKS = [
  {
    name: "Offers",
    description: "Manage the offers you've placed on marketplace listings",
    icon: HiOutlineTag,
  },
  {
    name: "Orders",
    description: "Track orders that include your store's products",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    name: "Withdrawals",
    description: "Request and track payouts from your store balance",
    icon: HiOutlineBanknotes,
  },
  {
    name: "Store settings",
    description: "Update your store profile, logo, and address",
    icon: HiOutlineCog6Tooth,
  },
];

export default function SellerDashboardPage() {
  const { store, hasStore, isLoading } = useGetProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary-500)] rounded-full animate-spin" />
          <p className="text-[var(--foreground-muted)] mt-4">Loading your store...</p>
        </div>
      </div>
    );
  }

  if (!hasStore || !store) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 text-center py-12">
          <HiOutlineBuildingStorefront className="w-10 h-10 text-[var(--foreground-muted)] mx-auto mb-3" />
          <p className="text-[var(--foreground)] font-bold mb-2">
            We couldn't find a store for your account
          </p>
          <Link
            href="/create-shop"
            className="btn-primary !w-auto px-5 h-9 text-sm inline-flex items-center gap-2 mt-2"
          >
            <span>+</span><span>Open a Store</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Welcome back</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            {store.name}
          </h1>
        </div>
        <Link
          href="/dashboard/seller/my-store"
          className="text-xs font-bold px-4 h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors flex items-center"
        >
          View store profile
        </Link>
      </div>

      {/* Store status */}
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <HiOutlineBuildingStorefront className="w-6 h-6 text-[var(--foreground-muted)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {store.isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--success-bg)] text-[var(--success-500)] text-xs font-bold">
              <HiOutlineCheckBadge className="w-3.5 h-3.5" />
              Verified store
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-500)] text-xs font-bold">
              <HiOutlineClock className="w-3.5 h-3.5" />
              Pending verification
            </span>
          )}
          <p className="text-sm text-[var(--foreground-muted)] mt-2">
            {store.isVerified
              ? "Buyers can find and purchase from your store."
              : "Your store is under review. This usually doesn't take long."}
          </p>
        </div>
      </div>

      {/* Sales stats & chart */}
      <SellerStats />
      {/* Coming soon sections — placeholders for the rest of the seller dashboard */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-3">
          Coming up next
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMING_SOON_LINKS.map((item) => (
            <div
              key={item.name}
              className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex items-start gap-4 opacity-70"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-[var(--foreground-muted)]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[var(--foreground)]">{item.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] bg-[var(--background-soft)] px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}