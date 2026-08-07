"use client";
import React from "react";

export interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    icon,
}) => {
    return (
        <div
            role="heading"
            aria-level={2}
            tabIndex={0}
            className="group/header flex items-center gap-3 mb-5 px-4 py-2.5 rounded-xl transition-all duration-300 ease-out transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)]
            bg-[var(--card-solid)] dark:bg-[var(--card-solid)] 
            border-l-4 border-l-[var(--secondary-600)] dark:border-l-[var(--accent-500)]
            border-y border-r border-[var(--border)]
            shadow-[var(--card-shadow-2)] hover:shadow-[var(--card-shadow-1)]
            hover:bg-[var(--background-soft)]"
        >
            {/* Decorative Vertical Pill */}
            <div className="flex items-center h-full">
                <span
                    style={{ backgroundImage: 'var(--gradient)' }}
                    className="w-1.5 h-5 rounded-full transition-all duration-300 group-hover/header:h-7 block"
                />
            </div>

            {/* Title Container */}
            <div className="flex flex-col min-w-0 flex-1 pl-1">
                <span className="text-[var(--foreground)] sm:text-base md:text-lg font-semibold tracking-wide transition-colors duration-200 group-hover/header:text-[var(--secondary-600)] dark:group-hover/header:text-[var(--accent-400)] truncate">
                    {title}
                </span>
            </div>

            {/* Icon Container */}
            {icon && (
                <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease-out shadow-sm scale-100 group-hover/header:scale-105
                    bg-[var(--background)] dark:bg-[var(--background-soft)]
                    border border-[var(--border)] group-hover/header:border-[var(--secondary-500)]/30 dark:group-hover/header:border-[var(--accent-500)]/30
                    text-[var(--foreground-muted)] group-hover/header:text-[var(--secondary-600)] dark:group-hover/header:text-[var(--accent-400)]"
                >
                    <div className="text-base flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionHeader;