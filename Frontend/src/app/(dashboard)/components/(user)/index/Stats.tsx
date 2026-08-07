"use client";
import React from 'react'
import {
    HiOutlineShoppingBag,
    HiOutlineHeart,
    HiOutlineTag,
} from "react-icons/hi2";

interface StatsProps {
    ordersCount: number;
    ordersHasMore?: boolean;
    listingsCount: number;
    listingsHasMore?: boolean;
    activeListingsCount: number;
    favoritesCount: number;
}

function formatCount(count: number, hasMore?: boolean) {
    return hasMore ? `${count}+` : `${count}`;
}

export default function Stats({
    ordersCount,
    ordersHasMore,
    listingsCount,
    listingsHasMore,
    activeListingsCount,
    favoritesCount,
}: StatsProps) {
    const stats = [
        {
            label: "Orders",
            value: formatCount(ordersCount, ordersHasMore),
            icon: HiOutlineShoppingBag,
            color: "cat-icon-blue",
        },
        {
            label: "Listings",
            value: formatCount(listingsCount, listingsHasMore),
            icon: HiOutlineTag,
            color: "cat-icon-purple",
            trend: `${activeListingsCount} active`,
        },
        {
            label: "Favorites",
            value: formatCount(favoritesCount),
            icon: HiOutlineHeart,
            color: "cat-icon-pink",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s) => {
                const Icon = s.icon;
                return (
                    <div key={s.label} className="card p-4 flex flex-col gap-3 rounded-2xl border border-[var(--border)]">
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-[var(--foreground)]" />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[var(--foreground)] leading-none mb-1">{s.value}</p>
                            <p className="text-xs text-[var(--foreground-subtle)] font-medium">{s.label}</p>
                        </div>
                        {s.trend && (
                            <p className="text-[11px] text-[var(--foreground-muted)] border-t border-[var(--border)] pt-2">{s.trend}</p>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
