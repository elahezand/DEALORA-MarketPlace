"use client";
import React from 'react';
import dynamic from "next/dynamic";
import { HiChevronRight } from 'react-icons/hi';
import { useInfiniteGet } from '@/utils/hooks/useReactQueryHooks';
const StoresList = dynamic(() => import("@/components/stores/storesList"));

interface InfiniteStoresSectionProps {
    initialData: any[];
    initialPagination: any;
}

export default function InfiniteStoresSection({
    initialData,
    initialPagination,
}: InfiniteStoresSectionProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteGet<any>('/stores/verified', "verified-stores",
        {
            initialData: {
                pages: [{ data: initialData, pagination: initialPagination }],
                pageParams: [null],
            }
        });

    const allStores = data?.pages?.flatMap((page) => page.data) || [];

    return (
        <div className="w-full flex flex-col items-center bg-transparent">
            <StoresList data={allStores} />
            {hasNextPage && (
                <div className="mt-8 flex justify-center w-full">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="flex !w-full items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white  hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[var(--primary-500)]/10 dark:shadow-none transition-all duration-200"
                    >
                        <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
                        <HiChevronRight className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? 'animate-spin' : 'group-hover:translate-x-0.5'}`} />
                    </button>
                </div>
            )}
        </div>
    );
}