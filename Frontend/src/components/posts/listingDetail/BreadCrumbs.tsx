import React from 'react'
import Link from 'next/link'

interface CategoryItem {
    _id: string;
    title: string;
    slug?: string;
}

interface CategoryComponentProps {
    categories: CategoryItem[];
}

export default function BreadCrumbs({ categories }: CategoryComponentProps) {

  return (
    <div>
        {categories.length > 0 && (
            <nav className="flex items-center flex-wrap gap-2 text-xs text-[var(--foreground-subtle)] pb-6 select-none font-medium tracking-wide">
                <Link
                    href="/"
                    className="hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-500)] transition-colors duration-200 cursor-pointer ease-out"
                >
                    Home
                </Link>

                {categories.map((cat, index) => {
                    const isLast = index === categories.length - 1;
                    return (
                        <div key={cat._id} className="flex items-center gap-2">
                            <span className="opacity-30 font-light text-[var(--foreground-subtle)]">/</span >
                            {isLast || !cat.slug ? (
                                <span
                                    className={
                                        isLast
                                            ? "text-[var(--foreground)] font-semibold tracking-normal"
                                            : "transition-all duration-200 ease-out hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-500)] cursor-pointer"
                                    }
                                >
                                    {cat.title}
                                </span>
                            ) : (
                                <Link
                                    href={`/posts?category=${cat.slug}`}
                                    className="transition-all duration-200 ease-out hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-500)] cursor-pointer"
                                >
                                    {cat.title}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>
        )}
    </div>
  )
}
