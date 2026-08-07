"use client";

import React from "react";

interface SectionHeadingProps {
    icon: React.ReactNode;
    title: string;
}

export default function SectionHeading({ icon, title }: SectionHeadingProps) {
    return (
        <div className="flex items-center gap-2 mb-4 select-none group">
            <span className="text-[var(--foreground-muted)] dark:text-[var(--foreground-subtle)] transition-colors duration-200 flex items-center justify-center">
                {icon}
            </span>
            <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight transition-colors duration-200">
                {title}
            </h3>
        </div>
    );
}