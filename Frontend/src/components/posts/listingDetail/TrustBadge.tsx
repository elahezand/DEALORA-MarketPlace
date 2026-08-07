import React from 'react';

export default function TrustBadge({
    icon,
    label
}: {
    icon: React.ReactNode;
    label: string
}) {
    return (
        <div className="flex items-center justify-center gap-2 py-2 px-3.5 select-none rounded-full border border-[var(--border)] bg-[var(--background-soft)]/40 hover:bg-[var(--background-soft)]/80 transition-all duration-200 group w-fit mx-auto">
            <span className="text-[var(--primary-500)] dark:text-[var(--accent-400)] flex-shrink-0 transition-colors duration-200 group-hover:text-[var(--primary-600)] dark:group-hover:text-[var(--accent-300)] flex items-center justify-center">
                {icon}
            </span>
            <span className="text-[13px] font-semibold text-[var(--foreground)] dark:text-[var(--neutral-100)] tracking-wide transition-colors duration-200">
                {label}
            </span>
        </div>
    );
}