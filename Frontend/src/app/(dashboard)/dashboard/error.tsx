"use client";

import Link from "next/link";

/* an error inside one dashboard page keeps the sidebar and lets the user retry */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <p className="text-[var(--foreground)] font-bold">Something went wrong on this page</p>
      <p className="text-sm text-[var(--foreground-muted)] max-w-md">
        {error.digest ? `Error code: ${error.digest}` : "Please try again in a moment."}
      </p>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={reset} className="btn-primary !w-auto px-5 h-10 text-sm">
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary !w-auto px-5 h-10 text-sm flex items-center">
          Dashboard home
        </Link>
      </div>
    </div>
  );
}
