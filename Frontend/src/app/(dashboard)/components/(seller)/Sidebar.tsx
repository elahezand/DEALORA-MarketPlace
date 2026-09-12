"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
    HiOutlineSquares2X2,
    HiOutlineBuildingStorefront,
    HiOutlineTag,
    HiOutlineClipboardDocumentList,
    HiOutlineBanknotes,
    HiOutlineCog6Tooth,
    HiOutlineArrowLeft,
} from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/useGetProfile";

interface SellerSidebarProps {
    isOpen: boolean;
}

interface SellerNavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const sellerMenuItems: SellerNavItem[] = [
    { name: "Overview", href: "/dashboard/seller", icon: HiOutlineSquares2X2 },
    { name: "Store Profile", href: "/dashboard/seller/my-store", icon: HiOutlineBuildingStorefront },
    { name: "My Offers", href: "/dashboard/seller/offers", icon: HiOutlineTag },
    { name: "Orders", href: "/dashboard/seller/orders", icon: HiOutlineClipboardDocumentList },
    { name: "Withdrawals", href: "/dashboard/seller/withdrawals", icon: HiOutlineBanknotes },
    { name: "Store Settings", href: "/dashboard/seller/settings", icon: HiOutlineCog6Tooth },
];

export function SellerSidebar({ isOpen }: SellerSidebarProps) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const { store } = useGetProfile();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <aside
            className={clsx(
                "fixed top-0 left-0 h-screen z-30 p-4 flex flex-col justify-between",
                "bg-[var(--card)] border-r border-[var(--border-strong)]",
                "transition-all duration-300 ease-out shadow-sm",
                isScrolled ? "pt-4" : "pt-16",
                isOpen ? "w-72" : "w-20"
            )}
        >
            {/* Nav items */}
            <div className="flex flex-col gap-2 w-full overflow-hidden">
                <div
                    className={clsx(
                        "mb-3 px-3 transition-all duration-200",
                        isOpen ? "opacity-100 h-auto" : "opacity-0 h-0 pointer-events-none"
                    )}
                >
                    <p className="menu-section-title whitespace-nowrap">Seller Panel</p>
                </div>

                <nav className="flex flex-col gap-1 w-full">
                    {sellerMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            pathname === item.href ||
                            (item.href === "/dashboard/seller" && pathname === "/dashboard/seller/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "sidebar-nav-link group",
                                    isActive ? "sidebar-nav-link-active-user" : "sidebar-nav-link-inactive"
                                )}
                            >
                                <Icon
                                    className={clsx(
                                        "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                                        isActive ? "scale-105" : "group-hover:scale-105"
                                    )}
                                />

                                <span
                                    className={clsx(
                                        "transition-all duration-200 whitespace-nowrap",
                                        isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 absolute"
                                    )}
                                >
                                    {item.name}
                                </span>

                                {!isOpen && <div className="sidebar-tooltip">{item.name}</div>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="w-full border-t border-[var(--border)] pt-4 mt-2 flex-shrink-0 flex flex-col gap-1">
                {store?.slug && (
                    <Link
                        href={`/stores/${store.slug}`}
                        target="_blank"
                        className="sidebar-nav-link sidebar-nav-link-inactive group"
                    >
                        <HiOutlineBuildingStorefront className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
                        <span
                            className={clsx(
                                "transition-all duration-200 whitespace-nowrap",
                                isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 absolute"
                            )}
                        >
                            View Storefront
                        </span>
                        {!isOpen && <div className="sidebar-tooltip">View Storefront</div>}
                    </Link>
                )}

                <Link href="/dashboard" className="sidebar-nav-link sidebar-nav-link-inactive group">
                    <HiOutlineArrowLeft className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
                    <span
                        className={clsx(
                            "transition-all duration-200 whitespace-nowrap",
                            isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 absolute"
                        )}
                    >
                        User Dashboard
                    </span>
                    {!isOpen && <div className="sidebar-tooltip">User Dashboard</div>}
                </Link>
            </div>
        </aside>
    );
}