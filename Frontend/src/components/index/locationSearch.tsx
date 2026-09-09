"use client";

import { useState, useTransition } from "react";
import { IoSearch, IoLocationOutline, IoChevronDown, IoClose } from "react-icons/io5";
import { useLocation } from "@/services/Location/useGetLocations";
import { useRouter } from "next/navigation";
import { Skeleton } from "@heroui/react";
import { log } from "node:console";

export default function LocationSearch() {
  const router = useRouter();
  const { data, isLoading } = useLocation();

  const [stateOpen, setStateOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSelectCity = (state: string | null) => {
    setSelectedState(state);
    setStateOpen(false);
  };

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (selectedState) params.set("state", selectedState);
      router.push(`/posts?listingType=user_ad&${params.toString()}`);
    });
  };

  return (
    <div
      className="flex items-stretch w-full bg-transparent overflow-visible transition-all duration-200">
      <div className="relative shrink-0 flex items-center">
        <button
          onClick={() => setStateOpen((p) => !p)}
          disabled={isLoading}
          className="h-full max-h-[46px] flex items-center gap-2 px-4 text-sm font-bold
                     text-[var(--foreground)] border-r border-[var(--border)]
                     hover:bg-[var(--background-soft)]
                     transition-colors duration-200 rounded-l-xl whitespace-nowrap
                     disabled:opacity-50"
        >
          <IoLocationOutline className="text-[var(--primary-600)] dark:text-[var(--accent-400)] text-lg shrink-0" />
          <span className="max-w-[90px] truncate text-[var(--foreground-muted)] font-semibold">
            {selectedState ?? "Anywhere"}
          </span>
          <IoChevronDown
            className={`text-[var(--foreground-subtle)] text-xs transition-transform duration-300 ease-out ${stateOpen ? "rotate-180" : ""}`}
          />
        </button>

        {stateOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setStateOpen(false)} />
            <div
              className="absolute top-[calc(100%+12px)] left-0 w-60
                         bg-[var(--card-solid)] border border-[var(--border-strong)]
                         rounded-xl shadow-[var(--card-shadow-hover)] z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold text-[var(--foreground-subtle)] uppercase tracking-widest">
                Filter by State
              </p>

              <button
                onClick={() => handleSelectCity(null)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-semibold
                            hover:bg-[var(--background-soft)]
                            ${!selectedState ? "text-[var(--primary-600)] dark:text-[var(--accent-400)] bg-[var(--background-soft)]" : "text-[var(--foreground-muted)]"}`}
              >
                Anywhere in US
              </button>

              <div className="h-px bg-[var(--border)] mx-3 my-1.5" />

              <div className="max-h-52 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col gap-1.5 p-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  data?.data.map(({ state }, idx) => (
                    <button
                      key={state ?? idx}
                      onClick={() => handleSelectCity(state)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between font-medium
                                  hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]
                                  ${selectedState === state ? "text-[var(--primary-600)] dark:text-[var(--accent-400)] font-bold bg-[var(--primary-50)]/30 dark:bg-[var(--primary-950)]/40" : "text-[var(--foreground-muted)]"}`}
                    >
                      <span>{state}</span>
                      {selectedState === state && selectedState !== null && <span className="text-xs text-[var(--primary-600)] dark:text-[var(--accent-400)]">✓</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Search input ── */}
      <div className="flex-1 flex items-center relative pl-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for electronics, clothing, books and more..."
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear"
            className="absolute right-3 p-1 rounded-full text-[var(--foreground-subtle)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)] transition-colors"
          >
            <IoClose className="text-base" />
          </button>
        )}
      </div>

      {/* ── Search button ── */}
      <button
        onClick={handleSearch}
        disabled={isPending}
        className="btn-primary shrink-0 !w-11 sm:!w-12 !px-0 ml-2"
      >
        <IoSearch className="text-lg stroke-[2px]" />
      </button>
    </div>
  );
}