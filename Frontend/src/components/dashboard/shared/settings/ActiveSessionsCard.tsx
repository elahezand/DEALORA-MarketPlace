"use client";

import { useState } from "react";
import {
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { useGetSessions } from "@/services/Session/useGetSessions";
import { useRevokeSession } from "@/services/Session/useRevokeSession";
import { useLogoutOthers } from "@/services/Session/useLogoutOthers";
import { ActiveSession } from "@/types/Session";
import { timeAgo } from "@/utils/timeAgo";

/** Very small user-agent parser — enough to show "Chrome on Windows". */
function describeDevice(userAgent: string) {
  const ua = userAgent || "";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\/|Opera/.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    "Unknown browser";

  const os =
    /Windows/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iOS/.test(ua) ? "iOS" :
    /Mac OS X|Macintosh/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" :
    "Unknown OS";

  return { label: `${browser} on ${os}`, isMobile };
}

export function ActiveSessionsCard() {
  const { sessions, isLoading, isError } = useGetSessions();
  const { mutate: revokeSession } = useRevokeSession();
  const { mutate: logoutOthers, isPending: isLoggingOutOthers } = useLogoutOthers();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const otherSessions = sessions.filter((s: ActiveSession) => !s.isCurrent);

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    revokeSession({ id }, { onSettled: () => setRevokingId(null) });
  };

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)] flex-wrap">
        <div className="flex items-center gap-2">
          <HiOutlineShieldCheck className="w-5 h-5 text-[var(--primary-500)]" />
          <h2 className="text-sm font-bold text-[var(--foreground)]">Active devices</h2>
        </div>
        {otherSessions.length > 0 && (
          <button
            type="button"
            onClick={() => logoutOthers()}
            disabled={isLoggingOutOthers}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50"
          >
            {isLoggingOutOthers ? "Signing out..." : "Sign out all other devices"}
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>}
      {isError && <p className="text-sm text-[var(--destructive)]">Could not load your devices.</p>}

      {!isLoading && !isError && (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {sessions.map((s: ActiveSession) => {
            const { label, isMobile } = describeDevice(s.userAgent);
            const Icon = isMobile ? HiOutlineDevicePhoneMobile : HiOutlineComputerDesktop;
            return (
              <li key={s._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[var(--foreground-muted)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">
                      {label}
                      {s.isCurrent && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--success-500)]/15 text-[var(--success-500)]">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                      {s.ip || "Unknown IP"} · last active {timeAgo(s.lastUsedAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(s._id)}
                  disabled={revokingId === s._id}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {revokingId === s._id ? "..." : s.isCurrent ? "Log out" : "Sign out"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
