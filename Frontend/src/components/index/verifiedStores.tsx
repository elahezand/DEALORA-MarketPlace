"use client";

import Link from "next/link";
import { useGetVerifiedStores } from "@/services/Store/useVerifyStore";
export default function VerifiedStores() {
  const { stores, isLoading, isError } = useGetVerifiedStores();

  if (!isLoading && (!stores || stores.length === 0)) return null;
  if (isError) return null;

  const topStores = stores.slice(0, 5);

  return (
    <Link
      href="/stores"
      className="
        flex items-center justify-between gap-4
        w-full p-5 sm:p-6
        rounded-[var(--radius)]
        border border-[var(--border)]
        bg-[var(--card-solid)]
        hover:border-primary-300 dark:hover:border-primary-700
        hover:shadow-md
        transition-all duration-200
        group
      "
    >
      <div className="flex items-center gap-4">
        {/* AVATAR STACK */}
        <div className="flex items-center -space-x-3 rtl:space-x-reverse shrink-0">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-[var(--card-solid)] bg-[var(--border-strong)]/30 animate-pulse"
                />
              ))
            : topStores.map((store) => (
                <div
                  key={store._id}
                  className="w-10 h-10 rounded-full border-2 border-[var(--card-solid)] bg-[var(--background-soft)] overflow-hidden flex items-center justify-center"
                >
                  {store.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {store.name.charAt(0)}
                    </span>
                  )}
                </div>
              ))}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[var(--foreground)]">Verified Stores</h3>
            <span className="text-primary-600 dark:text-primary-400">✅</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            See all businesses we've confirmed are legit.
          </p>
        </div>
      </div>

      <span className="shrink-0 text-[var(--foreground-muted)] group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all">
        →
      </span>
    </Link>
  );
}