"use client"
import React from 'react';
import dynamic from "next/dynamic";
import { HiChevronRight } from 'react-icons/hi';
import qs from 'qs';
import { useInfiniteGet } from '@/utils/hooks/useReactQueryHooks';
const ItemsList = dynamic(() => import("@/components/posts/itemsList"));

interface InfiniteItemsSectionProps {
    initialData: any[];
    initialPagination: any;
    queryString: string;
}

export default function InfiniteItemsSection({
    initialData,
    initialPagination,
    queryString
}: InfiniteItemsSectionProps) {
    const parsedParams = qs.parse(queryString);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteGet<any>('/listings', parsedParams, {
        initialData: {
            pages: [{ data: initialData, pagination: initialPagination }],
            pageParams: [null],
        }
    });

    const allItems = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="w-full flex flex-col items-center bg-transparent">
            <ItemsList data={allItems} />
            {hasNextPage && (
                <div className="mt-8 flex justify-center w-full">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="flex !w-full items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white  hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[var(--primary-500)]/10 dark:shadow-none transition-all duration-200"
                    >
                        <span >{isFetchingNextPage ? "Loading..." : "Load More"}</span>
                        <HiChevronRight className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? 'animate-spin' : 'group-hover:translate-x-0.5'}`} />
                    </button>
                </div>
            )}
        </div>
    );
}