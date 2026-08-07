"use client";

import { useEffect, useState } from "react";

interface BooleanFilterItemProps {
    filter: any;
    filterKey: string;
    urlChecked: boolean;
    appendToFilter: (key: string, value: boolean) => void;
}

export default function BooleanFilterItem({
    filter,
    filterKey,
    urlChecked,
    appendToFilter,
}: BooleanFilterItemProps) {
    const [checked, setChecked] = useState(urlChecked);

    useEffect(() => {
        setChecked(urlChecked);
    }, [urlChecked]);

    return (
            <label
                htmlFor={filterKey}
                className="flex items-center justify-between group cursor-pointer select-none"
            >
                <span
                    className={`font-medium text-sm transition-colors duration-200 ${checked
                        ? "text-[var(--primary-500)] dark:text-[var(--label-color)]"
                        : "text-[var(--foreground)] group-hover:text-[var(--primary-500)] dark:group-hover:text-[var(--label-color)]"
                        }`}
                >
                    {filter.name}
                </span>

                <input
                    id={filterKey}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                        const value = e.target.checked;
                        setChecked(value);
                        appendToFilter(filterKey, value);
                    }}
                    className="!w-4 !h-4 rounded border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                />
            </label>
    );
}