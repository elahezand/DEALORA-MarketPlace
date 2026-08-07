"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineCog6Tooth,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFlag,
} from "react-icons/hi2";
import StorePanel from "../../../(store)/storePanel/storePanel";
import { useUnreadConversationsCount } from "@/services/Chat/useUnreadConversationsCount";

interface AppSidebarProps {
  isOpen: boolean;
}

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: HiOutlineSquares2X2 },
  { name: "My Listings", href: "/dashboard/listings", icon: HiOutlineTag },
  { name: "Favorites", href: "/dashboard/favorites", icon: HiOutlineHeart },
  { name: "My Orders", href: "/dashboard/orders", icon: HiOutlineShoppingBag },
  { name: "Messages", href: "/dashboard/messages", icon: HiOutlineChatBubbleLeftRight },
  { name: "My Reports", href: "/dashboard/reports", icon: HiOutlineFlag },
  { name: "Settings", href: "/dashboard/settings", icon: HiOutlineCog6Tooth },
];

export function AppSidebar({ isOpen }: AppSidebarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const { unreadCount } = useUnreadConversationsCount();

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
        "fixed top-0 h-screen z-30 p-4 flex flex-col justify-between",
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
          <p className="menu-section-title whitespace-nowrap mt-4">
            Account Management
          </p>
        </div>

        <nav className="flex flex-col gap-1 w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isMessages = item.name === "Messages";
            const showBadge = isMessages && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "sidebar-nav-link group relative",
                  isActive
                    ? "sidebar-nav-link-active-user"
                    : "sidebar-nav-link-inactive"
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon
                    className={clsx(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "scale-105" : "group-hover:scale-105"
                    )}
                  />
                  {showBadge && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--destructive)] ring-2 ring-[var(--card)]" />
                  )}
                </span>

                <span
                  className={clsx(
                    "flex-1 flex items-center justify-between transition-all duration-200 whitespace-nowrap",
                    isOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4 absolute"
                  )}
                >
                  <span>{item.name}</span>
                  {showBadge && (
                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[var(--destructive)] text-white text-[10px] font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>

                {!isOpen && (
                  <div className="sidebar-tooltip">
                    {item.name}
                    {showBadge ? ` (${unreadCount})` : ""}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Store section */}
      <StorePanel isOpen={isOpen} />
    </aside>
  );
}