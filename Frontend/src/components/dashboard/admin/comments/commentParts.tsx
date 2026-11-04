"use client";

import { HiOutlineStar, HiStar } from "react-icons/hi2";
import { AdminComment, CommentStatus } from "@/types/CommentTypes";

/* small helpers shared by the admin comments table and its modals */

export const STATUS_TONE: Record<CommentStatus, "success" | "warning" | "destructive" | "info" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  spam: "destructive",
  deleted: "neutral",
};

export const RECOMMENDATION_LABEL = {
  recommended: "Recommends it",
  not_recommended: "Doesn't recommend it",
  no_idea: "No opinion",
} as const;

export const nameOf = (user?: AdminComment["user"] | { username?: string; name?: string; phone?: string } | string | null) =>
  typeof user === "object" && user ? user.username || ("name" in user ? user.name : "") || ("phone" in user ? user.phone : "") || "user" : "user";

export const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const chip = (active: boolean) =>
  `text-xs font-bold px-4 py-2 rounded-xl border transition-all ${active
    ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)] shadow-sm"
    : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
  }`;

export const selectClass =
  "h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)]";

export const iconBtn =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border)] transition-colors disabled:opacity-40";

export function Stars({ value }: { value?: number | null }) {
  if (typeof value !== "number") return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? <HiStar key={i} className="w-3.5 h-3.5" /> : <HiOutlineStar key={i} className="w-3.5 h-3.5 opacity-40" />
      )}
    </span>
  );
}
