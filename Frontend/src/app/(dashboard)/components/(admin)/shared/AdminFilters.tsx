"use client";

import { useEffect, useState } from "react";
import { QueryParams } from "@/types/api/ErrorTypes";

interface AdminFiltersProps {
  value: QueryParams;
  onChange: (next: QueryParams) => void;
  showCategory?: boolean;
  categories?: { _id: string; title: string }[];
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export default function AdminFilters({
  value,
  onChange,
  showCategory = false,
  categories = [],
  showSearch = false,
  searchPlaceholder = "Search...",
}: AdminFiltersProps) {
  const [search, setSearch] = useState(String(value.q ?? ""));

  useEffect(() => {
    setSearch(String(value.q ?? ""));
  }, [value.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = { ...value };
      if (search.trim()) next.q = search.trim();
      else delete next.q;
      if (next.q !== value.q) onChange(next);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const update = (key: string, v: string) => {
    const next = { ...value };
    if (v) next[key] = v;
    else delete next[key];
    onChange(next);
  };

  const clear = () => {
    const next: QueryParams = {};
    if (value.status) next.status = value.status;
    onChange(next);
    setSearch("");
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
      {showSearch && (
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">From</span>
        <input
          type="date"
          value={String(value.dateFrom ?? "")}
          onChange={(e) => update("dateFrom", e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">To</span>
        <input
          type="date"
          value={String(value.dateTo ?? "")}
          onChange={(e) => update("dateTo", e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Sort</span>
        <select
          value={String(value.sortOrder ?? "desc")}
          onChange={(e) => update("sortOrder", e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </label>



      {showCategory && (
        <label className="flex min-w-[180px] flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Category</span>
          <select
            value={String(value.categoryId ?? "")}
            onChange={(e) => update("categoryId", e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.title}</option>
            ))}
          </select>
        </label>
      )}

        <button
          type="button"
          onClick={clear}
          className="h-9 self-end rounded-lg border border-[var(--border)] bg-[var(--card-solid)] px-4 text-xs font-semibold text-[var(--foreground-muted)] transition-colors mb-2 hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
        >
          Clear
        </button>
      </div>
  );
}
