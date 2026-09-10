"use client"
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetArticles } from "@/services/Article/useGetArticles";
import { IArticle } from "@/types/Article";
import { CategoriesTypeResponse, ICategory } from "@/types/Category";

export default function SupportSection() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: articlesData, isLoading: isLoadingArticles } = useGetArticles({ limit: 20 });
  const articles: IArticle[] = articlesData?.pages?.[0]?.data ?? [];

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGet<CategoriesTypeResponse>("/categories");
  const categories: ICategory[] = (categoriesData?.data ?? []).slice(0, 6);

  const matches = query
    ? articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase())
    )
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-7xl max-auto relative z-10">
      <div className="card p-8 md:p-12 text-center relative z-20">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent rounded-t-[inherit]" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="text-left">
            <span className="text-lg md:text-2xl font-bold block text-[var(--primary-600)] dark:text-[var(--accent-400)]">
              Welcome to the Support Center
            </span>
            <span className="text-sm font-medium mt-1 block text-[var(--foreground-muted)]">
              How can we help you today?
            </span>
          </div>

          <div className="w-full lg:w-1/2 relative z-30 px-4" ref={ref}>
            {query && (
              <button
                onClick={() => { setQuery(""); setOpen(false); }}
                aria-label="Clear"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition duration-200 z-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(Boolean(e.target.value.trim())); }}
              onFocus={() => { if (query.trim()) setOpen(true); }}
              autoComplete="off"
              id="search-input"
              type="text"
              placeholder="Search articles..."
            />

            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--primary-500)] dark:text-[var(--accent-400)] pointer-events-none z-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
            </div>
          </div>
        </div>

        {open && (
          <div
            className="absolute right-0 left-0 mx-4 top-full mx-4 md:mx-8 bg-[var(--card-solid)] border border-[var(--border)] rounded-xl max-h-80 overflow-y-auto z-50 shadow-[var(--card-shadow-hover)] divide-y divide-[var(--border)] animate-in fade-in slide-in-from-top-2 duration-200 text-left"
            role="listbox"
          >
            {matches.map((m) => (
              <div
                key={m._id}
                role="option"
                onClick={() => router.push(`/supports/article/${m._id}`)}
                className="px-5 py-3 hover:bg-[var(--background-soft)] cursor-pointer transition duration-150 group"
              >
                <div className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary-500)] dark:group-hover:text-[var(--accent-400)] text-sm transition duration-150">
                  {m.title}
                </div>
                <div className="text-xs text-[var(--foreground-subtle)] mt-0.5 line-clamp-1">
                  {m.excerpt}
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <div className="px-5 py-4 text-sm text-[var(--foreground-muted)] font-medium text-center">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr,320px] gap-8 relative z-10 mt-8">
        <div className="card p-6 md:p-8">
          <div className="mb-6 border-b border-[var(--border)] pb-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
              You might be wondering
            </h3>
          </div>

          {isLoadingArticles ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[140px] rounded-xl bg-[var(--background-soft)] border border-[var(--border)] animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] py-8 text-center">
              No articles yet — check back soon.
            </p>
          ) : (
            <section className="grid gap-4 text-left">
              {articles.slice(0, 4).map((a) => (
                <article
                  key={a._id}
                  className="bg-[var(--background-soft)] border border-[var(--border)] p-5 rounded-xl hover:shadow-[var(--card-shadow-2)] transition duration-200 flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <h4 className="text-[var(--foreground)] font-bold text-base leading-snug">
                      {a.title}
                    </h4>
                    <p className="text-[var(--foreground-muted)] text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {a.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                    <small className="text-[var(--foreground-subtle)] font-semibold uppercase tracking-wider text-[10px]">
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                    <Link
                      href={`/supports/article/${a._id}`}
                      className="btn-primary !h-8 !px-4 !text-[12px] font-bold"
                    >
                      Read more
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>

        {/* PLATFORM CATEGORIES */}
        <div className="card p-6 h-fit md:col-span-2 lg:col-span-1">
          <div className="mb-6 border-b border-[var(--border)] pb-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
              Get to know the platform
            </h3>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[52px] rounded-xl bg-[var(--background-soft)] border border-[var(--border)] animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] py-4 text-center">
              No categories yet.
            </p>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-left">
              {categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between bg-[var(--background-soft)] border border-[var(--border)] p-3.5 rounded-xl hover:shadow-[var(--card-shadow-2)] transition duration-150"
                >
                  <span className="text-[var(--foreground)] text-sm font-bold pl-1">
                    {c.title}
                  </span>
                  <Link
                    href={`/posts?category=${c.slug}`}
                    className="btn-primary !h-8 !px-4 !text-[12px] font-bold"
                  >
                    Explore
                  </Link>
                </div>
              ))}
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
