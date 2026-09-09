"use client";

import { useRef, useEffect, useState } from "react";
import {
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";

import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useMarkNotificationSeen } from "@/services/Notifications/useMarkNotificationSeen";
import { useDeleteNotification } from "@/services/Notifications/useDeleteNotification";

interface AdminNotification {
  _id: string;
  msg: string;
  see: number;
  createdAt: string;
}
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGet<AdminNotification[]>("/notifications");

  const notifications = (data ?? []).slice(0, 6);

  const unseenCount = (data ?? []).filter(
    (n) => !n.see
  ).length;

  const { mutate: markSeen } =
    useMarkNotificationSeen();

  const { mutate: remove } =
    useDeleteNotification();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors">
        <HiOutlineBellAlert size={22} />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[var(--destructive)] text-white text-[10px] font-bold ring-2 ring-[var(--card)] leading-none">
            {unseenCount > 99
              ? "99+"
              : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--card-solid)] border border-[var(--border)] rounded-2xl shadow-[var(--card-shadow-hover)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--foreground)]">
              Notifications
            </p>
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
                  <li
                    key={n._id}
                    className="flex items-start gap-2 px-4 py-3"
                  >
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        seen
                          ? "bg-[var(--foreground-subtle)]"
                          : "bg-[var(--primary-500)]"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${
                          seen
                            ? "text-[var(--foreground-muted)]"
                            : "text-[var(--foreground)] font-semibold"
                        }`}
                      >
                        {n.msg}
                      </p>

                      <p className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">
                        {new Date(
                          n.createdAt
                        ).toLocaleString("en-US")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!seen && (
                        <button
                          type="button"
                          title="Mark as seen"
                          onClick={() =>
                            markSeen({ id: n._id })
                          }
                          className="p-1.5 hover:bg-[var(--background-soft)] rounded-lg transition-colors"
                        >
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[var(--success-500)]" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete"
                        onClick={() =>
                          remove({ id: n._id })
                        }
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
