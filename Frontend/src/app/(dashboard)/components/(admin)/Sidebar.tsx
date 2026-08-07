"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
  HiOutlineDocumentCheck,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlineRectangleGroup,
  HiOutlineTag,
  HiOutlineBanknotes,
  HiOutlineTicket,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFlag,
  HiOutlineLifebuoy,
  HiOutlineEnvelope,
  HiOutlineBell,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";

interface AdminSidebarProps {
  isOpen: boolean;
}

interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const adminMenuGroups: AdminNavGroup[] = [
  {
    label: "General",
    items: [
      { name: "Overview", href: "/dashboard/admin", icon: HiOutlineSquares2X2 },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: HiOutlineChartBar },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Categories", href: "/dashboard/admin/categories", icon: HiOutlineRectangleGroup },
      { name: "Pending Listings", href: "/dashboard/admin/listings", icon: HiOutlineDocumentCheck },
      { name: "Seller Offers", href: "/dashboard/admin/offers", icon: HiOutlineTag },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Transactions", href: "/dashboard/admin/transactions", icon: HiOutlineCreditCard },
      { name: "Withdrawals", href: "/dashboard/admin/withdrawals", icon: HiOutlineBanknotes },
      { name: "Coupons", href: "/dashboard/admin/coupons", icon: HiOutlineTicket },
    ],
  },
  {
    label: "Community",
    items: [
      { name: "Users", href: "/dashboard/admin/users", icon: HiOutlineUsers },
      { name: "Stores", href: "/dashboard/admin/stores", icon: HiOutlineBuildingStorefront },
      { name: "Comments", href: "/dashboard/admin/comments", icon: HiOutlineChatBubbleLeftRight },
      { name: "Reports", href: "/dashboard/admin/reports", icon: HiOutlineFlag },
      { name: "Support", href: "/dashboard/admin/support", icon: HiOutlineLifebuoy },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Newsletter", href: "/dashboard/admin/newsletter", icon: HiOutlineEnvelope },
      { name: "Notifications", href: "/dashboard/admin/notifications", icon: HiOutlineBell },
      { name: "Settings", href: "/dashboard/admin/settings", icon: HiOutlineCog6Tooth },
    ],
  },
];

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
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
      {/* Nav items scrollable area */}
      <div className="flex flex-col gap-5 w-full flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <div
          className={clsx(
            "px-3 transition-all duration-200 flex-shrink-0",
            isOpen ? "opacity-100 h-auto" : "opacity-0 h-0 pointer-events-none"
          )}
        >
          <p className="menu-section-title admin-section-title whitespace-nowrap font-bold">
            Admin Controls
          </p>
        </div>

        {adminMenuGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 w-full flex-shrink-0">
            <div
              className={clsx(
                "px-3 mb-1 transition-all duration-200",
                isOpen ? "opacity-100 h-auto" : "opacity-0 h-0 pointer-events-none"
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] whitespace-nowrap">
                {group.label}
              </p>
            </div>

            <nav className="flex flex-col gap-1 w-full">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "sidebar-nav-link group",
                      isActive ? "sidebar-nav-link-active-admin" : "sidebar-nav-link-inactive"
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
        ))}
      </div>

      {/* Footer fixed at bottom */}
      <div className="w-full border-t border-[var(--border)] pt-4 mt-2 flex-shrink-0">
        <Link
          href="/dashboard"
          className="sidebar-nav-link sidebar-nav-link-inactive group"
        >
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