"use client"
import React from 'react'
import { Accordion, AccordionItem, Slider } from "@heroui/react";
import { useGet } from '@/utils/hooks/useReactQueryHooks';
import BooleanFilterItem from './BooleanFilterItem';
import RadioFilterItem from './RadioFilterItem';
import RangeFilterItem from './RangeFilterItem';
import { GrFanOption } from 'react-icons/gr';
import SectionHeader from '../sectionHeader';
import { Skeleton } from '@heroui/react';
import { HiChevronRight } from "react-icons/hi";

interface OptionsProps {
    categoryId: string;
    appendToFilter: (field: string, value: any) => void;
    activeFilters?: Record<string, any>;
}

export default function Options({
    categoryId,
    appendToFilter,
    activeFilters = {},
}: OptionsProps) {

    const { data, isLoading } = useGet<any>(`/categories/${categoryId}`);
    if (isLoading)
        return (
            <div className="space-y-3 py-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-4/5 rounded-xl" />
                <Skeleton className="h-10 w-3/4 rounded-xl" />
            </div>
        );

    if (!data || data?.length === 0 || !data?.data?.filters)
        return (
            <div className="flex items-center justify-center h-full py-6">
                <p className="text-gray-500 dark:text-slate-500 font-medium">Not FOUND</p>
            </div>
        );

    const radioFilters = data.data.filters.filter((f: any) => f.type === 'radio' || f.isRadio);
    const booleanFilters = data.data.filters.filter((f: any) => f.type === 'boolean');
    const rangeFilters = data.data.filters.filter((f: any) => f.type === 'range');

    const accordionFilters = data.data.filters.filter((f: any) =>
        f.type !== 'radio' && !f.isRadio && f.type !== 'boolean' && f.type !== 'range'
    );

    return (
        <div className="py-6 transition-all duration-300 flex flex-col gap-6">
            {/*Haeder Option */}
            <div className="text-[var(--foreground)]">
                <SectionHeader
                    title="Options"
                    icon={<GrFanOption className="text-xl text-[var(--primary-400)] dark:text-[var(--accent-400)]" />}
                />
            </div>
            {/* 1. Range Filters (e.g., Price Range) */}
            {rangeFilters.length > 0 && (
                <div className="flex flex-col gap-4 pl-1 pb-4">
                    {rangeFilters.map((f: any, fIndex: number) => {
                        const filterKey = f.slug ?? f.name_en ?? f.name ?? String(fIndex);

                        const min = f.config?.min !== undefined ? Number(f.config.min) : 0;
                        const max = f.config?.max !== undefined ? Number(f.config.max) : 10000;
                        const step = f.config?.step !== undefined ? Number(f.config.step) : 50;
                        const currency = f.config?.currency ?? "USD";

                        let currentValue: [number, number] = [min, max];
                        if (Array.isArray(activeFilters[filterKey]) && activeFilters[filterKey].length === 2) {
                            currentValue = [Number(activeFilters[filterKey][0]), Number(activeFilters[filterKey][1])];
                        }

                        return (
                            <div key={`range-${fIndex}`} className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                    <h3 className="text-base font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                                        {f.name}
                                    </h3>
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                </div>
                                <RangeFilterItem
                                    min={min}
                                    max={max}
                                    step={step}
                                    currency={currency}
                                    value={currentValue}
                                    filterKey={filterKey}
                                    appendToFilter={appendToFilter}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
            {/* 2. Radio Filters  */}
            {radioFilters.length > 0 && (
                <div className="flex flex-col gap-4 pl-1">
                    {radioFilters.map((f: any, fIndex: number) => {
                        const filterKey = f.slug ?? f.name_en ?? f.name ?? String(fIndex);
                        return (
                            <div key={`radio-${fIndex}`} className="pb-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                    <h3 className="text-base font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                                        {f.name}
                                    </h3>
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    {Array.isArray(f.options) && f.options.map((op: any, oi: number) => {
                                        const display = (op && typeof op === "object")
                                            ? (op.label_en ?? op.label ?? String(op.value ?? ""))
                                            : String(op);

                                        const value = (op && typeof op === "object") ? (op.value ?? op) : op;
                                        const urlSelected = activeFilters[filterKey] === value;

                                        return (
                                            <RadioFilterItem
                                                key={oi}
                                                display={display}
                                                value={value}
                                                urlSelected={urlSelected}
                                                filterKey={filterKey}
                                                appendToFilter={appendToFilter}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* 3. Boolean Filters  */}
            {booleanFilters.length > 0 && (
                <div className="flex flex-col gap-6 pl-1 mt-4">
                    <div className="flex flex-col gap-1">
                        {booleanFilters.map((f: any, fIndex: number) => {
                            const filterKey = f.slug ?? f.name_en ?? f.name ?? String(fIndex);
                            const urlChecked = !!activeFilters[filterKey];

                            return (
                                <div key={`radio-${fIndex}`} className="pb-4 border-b border-[var(--border)]">
                                    <BooleanFilterItem
                                        key={`boolean-${fIndex}`}
                                        filter={f}
                                        filterKey={filterKey}
                                        urlChecked={urlChecked}
                                        appendToFilter={appendToFilter}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* 4. accordion Filters  */}
            {accordionFilters.length > 0 && (
                <div className="flex flex-col gap-4 pl-1" id="options-acc">
                    <Accordion
                        selectionMode="multiple"
                        className="w-full bg-transparent px-0 border-none divide-y divide-[var(--border)]"
                        itemClasses={{
                            base: "py-2 w-full border-b border-[var(--border)] last:border-none",
                            title: "text-sm font-semibold text-[var(--foreground)] transition-colors duration-200",
                            trigger: "py-2.5 hover:bg-[var(--background-soft)] px-2 rounded-xl transition-all duration-200 flex items-center justify-between group",
                            content: "pt-3 pb-2 pl-2 flex flex-col gap-1.5 text-sm text-[var(--foreground-muted)]",
                        }}
                        aria-label="Options accordion"
                    >
                        {accordionFilters.map((f: any, fIndex: number) => {
                            const titleText = f.name_en ?? f.name ?? f.slug ?? "Option";

                            return (
                                <AccordionItem
                                    key={`acc-${fIndex}`}
                                    aria-label={`${titleText} options`}
                                    indicator={
                                        <HiChevronRight className="text-xl text-[var(--foreground-subtle)] group-data-[open=true]:rotate-90 group-data-[open=true]:text-[var(--primary-500)] dark:group-data-[open=true]:text-[var(--accent-400)] transition-all duration-200" />
                                    }
                                    title={
                                        <span className="acc-header block text-sm font-semibold text-[var(--foreground)]">
                                            {f.name}
                                        </span>
                                    }
                                >
                                    {Array.isArray(f.options) && f.options.map((op: any, oi: number) => {
                                        const display = (op && typeof op === "object")
                                            ? (op.label_en ?? op.label ?? String(op.value ?? ""))
                                            : String(op);

                                        const value = (op && typeof op === "object") ? (op.value ?? op) : op;
                                        const filterKey = f.slug ?? f.name_en ?? f.name ?? fIndex;

                                        return (
                                            <button
                                                key={oi}
                                                type="button"
                                                onClick={() => appendToFilter(filterKey, value)}
                                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-400)] hover:bg-[var(--background-soft)] transition-all duration-200 group/opt"
                                            >
                                                <span className="truncate pr-2">{display}</span>
                                                <span className="opacity-0 group-hover/opt:opacity-100 text-xs font-bold text-[var(--primary-400)] dark:text-[var(--accent-400)] transition-all duration-200 transform translate-x-1 group-hover/opt:translate-x-0">
                                                    +
                                                </span>
                                            </button>
                                        );
                                    })}
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            )}
        </div>
    );
}