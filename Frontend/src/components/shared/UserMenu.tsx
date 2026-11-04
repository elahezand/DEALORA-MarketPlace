"use client";

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { getUrl } from "@/utils/helper";
import { IUser } from "@/types/User";

/* avatar chip in the header + the account dropdown */
export default function UserMenu({ user, onLogout: handleLogout }: { user: IUser; onLogout: () => void }) {
  const router = useRouter();

  const initials = user.username
    ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <button className="user-chip text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
          {user.profilePicture ? (
            <img
              src={getUrl(user.profilePicture) || ""}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--gradient)] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {initials}
            </div>
          )}

          <div className="hidden md:flex flex-col max-w-[120px]">
            <span className="text-[13px] font-bold truncate leading-tight text-[var(--foreground)]">
              {user.username || "My Account"}
            </span>
            <span className="text-[11px] text-[var(--foreground-subtle)] truncate">
              {user.phone || user.email || "Verified User"}
            </span>
          </div>
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="User Actions"
        classNames={{
          base: "page-card !rounded-2xl min-w-[220px] p-2",
        }}
      >
        <DropdownItem
          key="profile"
          textValue="Profile"
          onPress={() => router.push("/dashboard")}
          className="rounded-xl text-sm font-medium px-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Profile
        </DropdownItem>

        <DropdownItem
          key="Shop"
          textValue="Shop"
          onPress={() => router.push("/create-shop")}
          className="rounded-xl text-sm font-medium px-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Create Shop
        </DropdownItem>

        <DropdownItem
          key="settings"
          textValue="Settings"
          onPress={() => router.push("/dashboard/settings")}
          className="rounded-xl text-sm font-medium px-3 py-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Settings
        </DropdownItem>

        <DropdownItem
          key="listings"
          textValue="listings"
          onPress={() => router.push("/dashboard/listings")}
          className="rounded-xl text-sm font-medium px-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Listings
        </DropdownItem>

        <DropdownItem
          key="orders"
          textValue="orders"
          onPress={() => router.push("/dashboard/orders")}
          className="rounded-xl text-sm font-medium px-3  text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Orders
        </DropdownItem>

        <DropdownItem
          key="logout"
          className="rounded-xl border-t-2 border-[var(--border)] text-rose-600 dark:text-rose-400 font-semibold"
          onPress={handleLogout}
        >
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
