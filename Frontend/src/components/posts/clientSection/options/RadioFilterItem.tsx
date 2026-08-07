"use client"

import React, { useState, useEffect } from "react";

interface RadioFilterItemProps {
    display: string;
    value: any;
    urlSelected: boolean;
    filterKey: string;
    appendToFilter: (key: string, value: any) => void;
}

export default function RadioFilterItem({
    display,
    value,
    urlSelected,
    filterKey,
    appendToFilter
}: RadioFilterItemProps) {
    
    const [localSelected, setLocalSelected] = useState(urlSelected);

    useEffect(() => {
        setLocalSelected(urlSelected);
    }, [urlSelected]);

    return (
        <button
            type="button"
            onClick={() => {
                setLocalSelected(true); 
                appendToFilter(filterKey, value); 
            }}
            className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group/opt ${
                localSelected
                    ? "bg-[var(--background-soft)] text-[var(--primary-500)] dark:text-[var(--accent-400)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
            }`}
        >
            <span className={`truncate pr-2 font-semibold text-sm transition-colors duration-200 ${
                localSelected 
                    ? "text-[var(--primary-500)] dark:text-[var(--accent-400)] group-hover/opt:text-[var(--primary-500)] dark:group-hover/opt:text-[var(--accent-400)]" 
                    : "text-[var(--foreground)] group-hover/opt:text-[var(--foreground)]"
            }`}>
                {display}
            </span>
            
            {/* Smooth Radio Circle Indicator */}
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                localSelected
                    ? "border-[var(--primary-500)] dark:border-[var(--accent-400)]"
                    : "border-[var(--border-strong)] bg-transparent group-hover/opt:border-[var(--primary-500)] dark:group-hover/opt:border-[var(--accent-400)]"
            }`}>
                <div className={`w-2 h-2 rounded-full transition-all ${
                    localSelected
                        ? "bg-[var(--primary-500)] dark:bg-[var(--accent-400)] scale-100"
                        : "bg-transparent scale-0"
                }`} />
            </div>
        </button>
    );
}