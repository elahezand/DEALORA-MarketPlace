"use client";
import Link from "next/link";
import {
    HiOutlineBuildingStorefront,
    HiOutlineMapPin,
    HiOutlinePhone,
    HiOutlineStar,
    HiOutlineCheckBadge,
    HiOutlineClock,
    HiOutlinePencilSquare,
    HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/getProfile";

export default function MyStorePage() {
    const { store, hasStore, isLoading } = useGetProfile();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 pb-10">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="menu-section-title mb-1">Store</p>
                        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">My Store</h1>
                    </div>
                </div>
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
                    <p className="text-[var(--foreground-muted)] mt-4">Loading your store...</p>
                </div>
            </div>
        );
    }

    // No store yet -> prompt to create one
    if (!hasStore || !store) {
        return (
            <div className="flex flex-col gap-8 pb-10">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="menu-section-title mb-1">Store</p>
                        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">My Store</h1>
                    </div>
                </div>

                <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6">
                    <div className="text-center py-12">
                        <HiOutlineBuildingStorefront className="w-10 h-10 text-[var(--foreground-muted)] mx-auto mb-3" />
                        <p className="text-[var(--foreground)] font-bold mb-2">You don't have a store yet</p>
                        <p className="text-sm text-[var(--foreground-muted)] mb-4">
                            Open a store to start listing products and reach more buyers
                        </p>
                        <Link
                            href="/create-shop"
                            className="btn-primary !w-auto px-5 h-9 text-sm inline-flex items-center gap-2"
                        >
                            <span>+</span><span>Open a Store</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const address = store.address;
    const addressLine = [address?.street, address?.city, address?.province]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="menu-section-title mb-1">Store</p>
                    <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">My Store</h1>
                </div>
                <Link
                    href="/my-store/edit"
                    className="btn-primary !w-auto px-5 h-10 text-sm gap-2 flex items-center"
                >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                    <span>Edit Store</span>
                </Link>
            </div>

            {/* Store Profile Card */}
            <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        {store.logo ? (
                            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                            <HiOutlineBuildingStorefront className="w-10 h-10 text-[var(--foreground-muted)]" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-black text-[var(--foreground)] truncate">{store.name}</h2>
                            {store.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--success-bg)] text-[var(--success-500)] text-xs font-bold">
                                    <HiOutlineCheckBadge className="w-3.5 h-3.5" />
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-500)] text-xs font-bold">
                                    <HiOutlineClock className="w-3.5 h-3.5" />
                                    Pending Verification
                                </span>
                            )}
                        </div>

                        {store.slug && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-1 font-mono">/{store.slug}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-[var(--foreground-muted)]">
                            {addressLine && (
                                <span className="flex items-center gap-1.5">
                                    <HiOutlineMapPin className="w-4 h-4" />
                                    {addressLine}
                                </span>
                            )}
                            {store.phone && (
                                <span className="flex items-center gap-1.5">
                                    <HiOutlinePhone className="w-4 h-4" />
                                    {store.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center flex-shrink-0">
                        <HiOutlineStar className="w-6 h-6 text-[var(--warning-500)]" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-[var(--foreground)]">
                            {store.meta?.ratings?.toFixed(1) ?? "0.0"}
                        </p>
                        <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                            Average Rating
                        </p>
                    </div>
                </div>

                <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-300)] flex items-center justify-center flex-shrink-0">
                        <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-[var(--accent-600)]" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-[var(--foreground)]">
                            {store.meta?.reviewsCount ?? 0}
                        </p>
                        <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                            Reviews
                        </p>
                    </div>
                </div>
            </div>

            {/* Address Details */}
            {address && (address.province || address.city || address.street || address.postalCode) && (
                <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-4">
                        Store Address
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-[var(--foreground-muted)] text-xs mb-1">Province</p>
                            <p className="text-[var(--foreground)] font-semibold">{address.province || "—"}</p>
                        </div>
                        <div>
                            <p className="text-[var(--foreground-muted)] text-xs mb-1">City</p>
                            <p className="text-[var(--foreground)] font-semibold">{address.city || "—"}</p>
                        </div>
                        <div>
                            <p className="text-[var(--foreground-muted)] text-xs mb-1">Street</p>
                            <p className="text-[var(--foreground)] font-semibold">{address.street || "—"}</p>
                        </div>
                        <div>
                            <p className="text-[var(--foreground-muted)] text-xs mb-1">Postal Code</p>
                            <p className="text-[var(--foreground)] font-semibold">{address.postalCode || "—"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}