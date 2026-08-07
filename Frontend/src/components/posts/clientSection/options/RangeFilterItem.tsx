import React from 'react'
import { Slider } from '@heroui/react';
interface RangeFilterItemProps {
    value: any;
    step: number
    min: number,
    max: number,
    currency: string,
    filterKey: string;
    appendToFilter: (key: string, value: any) => void;
}

export default function RangeFilterItem({
    value,
    step,
    min,
    max,
    currency,
    filterKey,
    appendToFilter
}: RangeFilterItemProps) {
    return (
        <div className="px-2">
            <Slider
                label="Selected Range:"
                step={step}
                minValue={min}
                maxValue={max}
                value={value}
                onChangeEnd={(val) => appendToFilter(filterKey, val)}
                formatOptions={{ style: "currency", currency: currency }}
                className="max-w-full"
                size="sm"
                classNames={{
                    base: "max-w-md",
                    label: "text-xs text-[var(--foreground-muted)]",
                    value: "text-xs font-bold text-[var(--primary-500)] dark:text-[var(--accent-400)]",
                    thumb: "bg-[var(--primary-500)] dark:bg-[var(--accent-400)] w-5 h-5 after:w-2 after:h-2",
                    track: "bg-[var(--border-strong)] h-1",
                    filler: "bg-[var(--primary-500)] dark:bg-[var(--accent-400)]"
                }}
            />
            <div className="flex justify-between items-center mt-1 text-[10px] text-[var(--foreground-muted)] font-medium">
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(min)}</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(max)}</span>
            </div>
        </div>
    );
}
