"use client";

import Stats from "@/components/dashboard/admin/index/Stats";
import RecentUsers from "@/components/dashboard/admin/index/RecentUsers";
import RecentStores from "@/components/dashboard/admin/index/RecentStores";
import RecentOffers from "@/components/dashboard/admin/index/RecentOffers";
import RecentOrders from "@/components/dashboard/admin/index/RecentOrders";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="menu-section-title mb-1">Welcome back</p>
                    <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
                        Admin Dashboard
                    </h1>
                </div>
            </div>
            <Stats/>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RecentUsers />
                <RecentStores />
            </div>
            <RecentOffers />
            <RecentOrders />
        </div>
    );
}