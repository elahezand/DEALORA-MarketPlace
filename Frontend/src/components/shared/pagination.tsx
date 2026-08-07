"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import qs from 'qs';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface PaginationWrapperProps {
    pageCount?: number;
}

export default function Pagination({
    pageCount,
}: PaginationWrapperProps) {
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get("page")) || 1;
    const pathname = usePathname();

    if (!pageCount || pageCount <= 1) return null;

    const createPageHref = (pageNumber: number) => {
        const params = Object.fromEntries(searchParams.entries());
        if (pageNumber === 1) {
            delete params.page;
        } else {
            params.page = String(pageNumber);
        }
        
        const queryString = qs.stringify(params, { encode: false, skipNulls: true });
        return queryString ? `${pathname}?${queryString}` : pathname;
    };

    const renderPageNumbers = () => {
        const pages = [];
        const range = 2;
        for (let i = 1; i <= pageCount; i++) {
            if (i === 1 || i === pageCount || (i >= currentPage - range && i <= currentPage + range)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return pages.map((page, index) => {
            if (page === '...') {
                return (
                    <li key={`ellipsis-${index}`} className="px-2 text-slate-400 dark:text-slate-500 font-bold select-none tracking-wider">
                        ...
                    </li>
                );
            }

            const isCurrent = currentPage === page;

            return (
                <li key={page}>
                    <Link
                        href={createPageHref(page as number)}
                        className={`flex items-center justify-center min-w-[36px] h-9 px-3 rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-700
                            ${isCurrent 
                                ? "bg-[var(--destructive)] dark:bg-red-500/10 dark:border dark:border-red-500/30 text-white dark:text-red-400 shadow-md shadow-[var(--destructive)]/20 dark:shadow-none" 
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        {page}
                    </Link>
                </li>
            );
        });
    };

    return (
        <nav aria-label="Pagination Navigation" className="flex items-center justify-center mt-10">
            <ul className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
                {/* PREVIOUS BUTTON */}
                <li>
                    {currentPage > 1 ? (
                        <Link
                            href={createPageHref(currentPage - 1)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                            aria-label="Previous page"
                        >
                            <HiChevronLeft className="text-xl" />
                        </Link>
                    ) : (
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                            <HiChevronLeft className="text-xl" />
                        </span>
                    )}
                </li>

                {/* PAGE NUMBERS */}
                {renderPageNumbers()}
                {/* NEXT BUTTON */}
                <li>
                    {currentPage < pageCount ? (
                        <Link
                            href={createPageHref(currentPage + 1)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                            aria-label="Next page"
                        >
                            <HiChevronRight className="text-xl" />
                        </Link>
                    ) : (
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                            <HiChevronRight className="text-xl" />
                        </span>
                    )}
                </li>
            </ul>
        </nav>
    );
}