"use client";

import Link from "next/link";
import { HiOutlineChevronRight } from "react-icons/hi2";

interface WidgetHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  showViewAll?: boolean;
}

export function WidgetHeader({
  icon: Icon,
  title,
  href,
  showViewAll = false,
}: WidgetHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[var(--foreground-muted)]" />
        <span className="font-bold text-[var(--foreground)] text-sm">{title}</span>
      </div>

      {showViewAll && (
        <Link
          href={href}
          className="text-xs font-bold text-[var(--accent-500)] hover:text-[var(--accent-600)] flex items-center gap-1 transition-colors"
        >
          View all <HiOutlineChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}