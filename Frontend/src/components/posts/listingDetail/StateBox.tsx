import React from 'react';

export default function StatBox({
    label,
    value,
    accent = false
}: {
    label: string;
    value: string;
    accent?: boolean
}) {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)]/60 px-3 py-2.5 text-center select-none transition-all duration-200 hover:bg-[var(--background-soft)] flex flex-col justify-center gap-1 min-w-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--foreground-subtle)] leading-none block truncate">
                {label}
            </span>
            <p
                className={`text-xs font-bold tabular-nums truncate transition-colors ${accent
                        ? "text-[var(--primary-500)] dark:text-[var(--accent-400)]"
                        : "text-[var(--foreground)]"
                    }`}
            >
                {value}
            </p>
        </div>
    );
}