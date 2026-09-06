"use client";

import { useRef, useEffect, useState } from "react";
import { ThemeSwitcher } from "@/context/ThemeSwitcher";
import { HiOutlineBellAlert, HiOutlineCheckCircle, HiOutlineTrash } from "react-icons/hi2";
import Link from "next/link";
import { getUrl } from "@/utils/helper"
import { IUser } from "@/types/User";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useMarkNotificationSeen } from "@/services/Notifications/useMarkNotificationSeen";
import { useDeleteNotification } from "@/services/Notifications/useDeleteNotification";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";

interface AdminNotification {
  _id: string;
  msg: string;
  see: number;
  createdAt: string;
}

interface AppHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: IUser | null
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGet<AdminNotification[]>("/notifications");
  const notifications = (data ?? []).slice(0, 6);
  const unseenCount = (data ?? []).filter((n) => !n.see).length;

  const { mutate: markSeen } = useMarkNotificationSeen();
  const { mutate: remove } = useDeleteNotification();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
      >
        <HiOutlineBellAlert size={22} />
        {unseenCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--destructive)] ring-2 ring-[var(--card)] animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--card-solid)] border border-[var(--border)] rounded-2xl shadow-[var(--card-shadow-hover)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--foreground)]">Notifications</p>
            <Link
              href="/dashboard/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-[var(--primary-600)] dark:text-[var(--accent-400)] hover:underline"
            >
              View all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
              No notifications yet
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {notifications.map((n) => {
                const seen = n.see > 0;
                return (
                  <li key={n._id} className="flex items-start gap-2 px-4 py-3">
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        seen ? "bg-[var(--foreground-subtle)]" : "bg-[var(--primary-500)]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${seen ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)] font-semibold"}`}>
                        {n.msg}
                      </p>
                      <p className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">
                        {new Date(n.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!seen && (
                        <button
                          type="button"
                          title="Mark as seen"
                          onClick={() => markSeen({ id: n._id })}
                          className="p-1.5 hover:bg-[var(--background-soft)] rounded-lg transition-colors"
                        >
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[var(--success-500)]" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => remove({ id: n._id })}
                        className="p-1.5 hover:bg-[var(--destructive-bg)] rounded-lg transition-colors"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5 text-[var(--destructive)]" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function AppHeader({ isOpen, onToggle, user }: AppHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = !!user?.role?.includes("ADMIN");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = user?.username
    ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 w-full h-16 flex items-center bg-[var(--card)] border-b border-[var(--border-strong)] backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-4 md:px-6 gap-4">

        {/* Left: toggle + search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggle}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--background-soft)] hover:bg-[var(--border)] text-[var(--foreground)] transition-all duration-200"
          >
            {isOpen
              ? <TbLayoutSidebarLeftCollapseFilled size={20} />
              : <TbLayoutSidebarLeftExpandFilled size={20} />
            }
          </button>

          <div className="relative w-full hidden sm:block">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search listings, orders..."
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-[var(--border-strong)] bg-[var(--card-solid)] text-[10px] font-black text-[var(--foreground-subtle)] select-none pointer-events-none">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right: bell (admin only) + theme + user */}
        <div className="flex items-center gap-2">

          {isAdmin && <NotificationsBell />}
          {isAdmin && <div className="h-5 w-px bg-[var(--border-strong)]" />}

          <ThemeSwitcher />

          <div className="h-5 w-px bg-[var(--border-strong)]" />

          {user && (
            <div className="user-chip cursor-pointer">
              {user.profilePicture ? (
                <img
                  src={getUrl(user.profilePicture)||""}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--gradient)] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                  {user.username}
                </span>
                <span className="text-[11px] text-[var(--foreground-subtle)] whitespace-nowrap">
                  {user.phone}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}