"use client";
import Link from "next/link";
import { useGetProfile } from "@/services/Profile/getProfile";
import {
    HiOutlineBuildingStorefront,
    HiOutlineStar,
    HiOutlineCheckBadge,
    HiOutlinePlusCircle,
    HiOutlineClock,
} from "react-icons/hi2";



export default function StorePanel({isOpen}:any) {
    const { store, hasStore, isLoading } = useGetProfile();

    return (
        <div className="w-full pt-4 border-t border-[var(--border)] min-h-[85px] flex items-center justify-center overflow-hidden">
            {isLoading ? null : hasStore && store ? (
                isOpen ? (
                    <Link
                        href="/my-store"
                        className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--background-soft)] hover:bg-[var(--border)] transition-all duration-200 shadow-sm w-full p-3 flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--card-solid)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                            {store.logo ? (
                                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                            ) : (
                                <HiOutlineBuildingStorefront className="w-4 h-4 text-[var(--foreground-muted)]" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1">
                                <p className="text-xs font-bold text-[var(--foreground)] truncate">{store.name}</p>
                                {store.isVerified ? (
                                    <HiOutlineCheckBadge className="w-3.5 h-3.5 text-[var(--success-500)] flex-shrink-0" />
                                ) : (
                                    <HiOutlineClock className="w-3.5 h-3.5 text-[var(--warning-500)] flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[var(--foreground-muted)]">
                                <HiOutlineStar className="w-3 h-3 text-[var(--warning-500)]" />
                                <span>{store.meta?.ratings?.toFixed(1) ?? "0.0"}</span>
                                <span>·</span>
                                <span>{store.meta?.reviewsCount ?? 0} reviews</span>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <Link
                        href="/my-store"
                        className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--background-soft)] border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 group relative"
                    >
                        {store.logo ? (
                            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                            <HiOutlineBuildingStorefront className="w-4 h-4 text-[var(--foreground-muted)]" />
                        )}
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--neutral-800)] text-[var(--neutral-0)] text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                            {store.name}
                        </div>
                    </Link>
                )
            ) : isOpen ? (
                <div className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--background-soft)] p-3.5 w-full">
                    <div className="space-y-1 mb-3 text-left">
                        <h4 className="text-xs font-bold text-[var(--foreground)] tracking-tight">Launch Your Store!</h4>
                        <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
                            Sell items using your own custom brand identity.
                        </p>
                    </div>
                    <Link href="/create-shop" className="btn-primary text-[11px] h-9 rounded-xl">
                        Create Shop →
                    </Link>
                </div>
            ) : (
                <Link
                    href="/create-shop"
                    className="w-11 h-11 bg-[var(--gradient)] text-white flex items-center justify-center rounded-xl shadow-md hover:opacity-90 transition-all duration-200 group relative"
                >
                    <HiOutlinePlusCircle className="w-5 h-5" />
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--neutral-800)] text-[var(--neutral-0)] text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                        Setup Store Front
                    </div>
                </Link>
            )}
        </div>
    )
}


