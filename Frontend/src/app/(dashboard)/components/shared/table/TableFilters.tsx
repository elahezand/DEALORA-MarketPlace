"use client";

import { useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { CategoriesTypeResponse } from "@/types/Category";

export interface TableFilterValue {
  /** today | 7d | 30d | 90d | all | custom */
  preset: string;
  from?: string;
  to?: string;
  categoryId?: string;
  q?: string;
}

export const emptyFilters: TableFilterValue = { preset: "all" };

/** What the hooks send to the API (empty values are dropped) */
export const filtersToParams = (filters: TableFilterValue) => {
  const params: Record<string, string> = {};
  if (filters.preset && filters.preset !== "all" && filters.preset !== "custom") {
    params.preset = filters.preset;
  }
  if (filters.preset === "custom") {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
  }
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.q?.trim()) params.q = filters.q.trim();
  return params;
};

/** Key part for react-query, so changing a filter refetches */
export const filtersKey = (filters: TableFilterValue) => JSON.stringify(filtersToParams(filters));

const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "custom", label: "Custom" },
];

const chip = (active: boolean) =>
  `text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
    active
      ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
      : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
  }`;

const inputClass =
  "h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)]";

interface TableFiltersProps {
  value: TableFilterValue;
  onChange: (value: TableFilterValue) => void;
  /** show the category dropdown (listings / products tables) */
  withCategory?: boolean;
  /** show the search box */
  withSearch?: boolean;
  searchPlaceholder?: string;
  /** extra controls of the page (status tabs and so on) */
  children?: React.ReactNode;
}

export default function TableFilters({
  value,
  onChange,
  withCategory = false,
  withSearch = true,
  searchPlaceholder = "Search...",
  children,
}: TableFiltersProps) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");

  const { data: categoriesRes } = useGet<CategoriesTypeResponse>("/categories", undefined, {
    enabled: withCategory,
    queryKey: ["/categories"],
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesRes?.data ?? [];

  const setPreset = (preset: string) => {
    setShowCustom(preset === "custom");
    onChange({ ...value, preset, ...(preset === "custom" ? {} : { from: undefined, to: undefined }) });
  };

  const isFiltered =
    value.preset !== "all" || !!value.categoryId || !!value.q?.trim();

  return (
    <div className="dash-toolbar">
      {children && <div className="dash-chip-row">{children}</div>}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="dash-chip-row">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setPreset(preset.value)}
            className={chip(value.preset === preset.value)}
          >
            {preset.label}
          </button>
        ))}
        </div>

        {withCategory && (
          <select
            value={value.categoryId || ""}
            onChange={(e) => onChange({ ...value, categoryId: e.target.value || undefined })}
            className={`${inputClass} min-w-[150px]`}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.title}
              </option>
            ))}
          </select>
        )}

        {withSearch && (
          <div className="relative ml-auto w-full sm:w-64">
            <HiOutlineMagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
            <input
              value={value.q || ""}
              onChange={(e) => onChange({ ...value, q: e.target.value })}
              placeholder={searchPlaceholder}
              className={`${inputClass} pl-9 w-full`}
            />
          </div>
        )}

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              onChange(emptyFilters);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] inline-flex items-center gap-1"
          >
            <HiOutlineXMark className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-[var(--foreground-muted)]">From</label>
          <input
            type="date"
            value={value.from || ""}
            onChange={(e) => onChange({ ...value, preset: "custom", from: e.target.value })}
            className={inputClass}
          />
          <label className="text-xs font-bold text-[var(--foreground-muted)]">To</label>
          <input
            type="date"
            value={value.to || ""}
            onChange={(e) => onChange({ ...value, preset: "custom", to: e.target.value })}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
