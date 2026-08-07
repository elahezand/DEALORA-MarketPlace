"use client";

import React, { useTransition } from "react";
import { useLocation } from "@/services/Location/getLocations";
import { useRouter } from "next/navigation";

export default function PopularCities() {
  const router = useRouter();
  const { data, isLoading } = useLocation();
  const [isPending, startTransition] = useTransition();

  const setLocation = (state: string) => {
    startTransition(() => {
      localStorage.setItem("city", JSON.stringify({ state }));
      router.replace(`/posts?city=${encodeURIComponent(state)}`);
    });
  };

  if (isLoading || !Array.isArray(data?.cities)) return null;

  return (
    <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mt-4 text-xs font-semibold text-[var(--foreground-subtle)]">
      <span className="text-[var(--foreground-subtle)]/70">Trending:</span>
      {data.cities.slice(0, 5).map(({ state }: { state: string }, idx: number) => (
        <button
          key={state ?? idx}
          disabled={isPending}
          onClick={() => setLocation(state)}
          className="text-[var(--foreground-muted)] hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-400)] transition-colors duration-200 relative py-0.5 group"
        >
          {state}
          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[var(--primary-500)] dark:bg-[var(--accent-400)] transition-all duration-300 group-hover:w-full" />
        </button>
      ))}
    </div>
  );
}