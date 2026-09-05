import Link from "next/link";
import { IStore } from "@/types/User";

export default function StoresList({ data }: { data: IStore[] }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--foreground-muted)] py-16">
        No verified stores yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full">
      {data.map((store) => (
        <Link
          key={store._id}
          href={`/stores/${store.slug || store._id}`}
          className="
            group flex flex-col items-center text-center gap-3
            p-6 rounded-[var(--radius)]
            border border-[var(--border)]
            bg-[var(--card-solid)]
            hover:border-primary-300 dark:hover:border-primary-700
            hover:shadow-md
            transition-all duration-200
          "
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {store.name.charAt(0)}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary-600 dark:bg-primary-500 border-2 border-[var(--card-solid)] flex items-center justify-center text-[9px] text-white">
              ✓
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {store.name}
            </h3>
            {store.meta?.ratings ? (
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                ★ {store.meta.ratings.toFixed(1)} ({store.meta.reviewsCount || 0})
              </p>
            ) : store.address?.city ? (
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{store.address.city}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}