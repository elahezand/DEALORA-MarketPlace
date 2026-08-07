"use client";

import Link from "next/link";
import { HiOutlineEye } from "react-icons/hi2";

// ─── Table header cell ───────────────────────────────────────
export function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right"|"center";
}) {
  return (
    <th
      className={`px-6 py-4 text-${align} text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider`}
    >
      {children}
    </th>
  );
}


const TONE_CLASS = {
  success: "status-badge-success",
  warning: "status-badge-warning",
  destructive: "status-badge-destructive",
  neutral: "status-badge-neutral",
  info: "status-badge-info",
} as const;

export function Badge({
  tone,
  label,
}: {
  tone: keyof typeof TONE_CLASS;
  label: string;
}) {
  return (
    <div className={`status-badge ${TONE_CLASS[tone]}`}>
      {label}
    </div>
  );
}

// ─── Avatar / logo circle with fallback initials ─────────────
export function EntityAvatar({
  src,
  alt,
  fallback,
  shape = "circle",
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  shape?: "circle" | "square";
}) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";
  return (
    <div
      className={`w-10 h-10 bg-[var(--background-soft)] ${shapeClass} overflow-hidden flex-shrink-0 border border-[var(--border)]`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--foreground-muted)]">
          {fallback}
        </div>
      )}
    </div>
  );
}

// ─── "View details" row action ───────────────────────────────
export function ViewAction({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="p-2 inline-flex hover:bg-[var(--background-soft)] rounded-lg transition-colors"
      title="View"
    >
      <HiOutlineEye className="w-4 h-4 text-[var(--foreground-muted)]" />
    </Link>
  );
}