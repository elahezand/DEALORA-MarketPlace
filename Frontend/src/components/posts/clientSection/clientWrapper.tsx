"use client";
import { useSearchParams } from "next/navigation";
import { FaPhotoVideo } from "react-icons/fa";
import { FaExchangeAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SectionHeader from "./sectionHeader";
import qs from "qs"
import { IoSearch } from "react-icons/io5";
import CategorySection from "./categorySection";
import Options from "./options/options";
import { useMemo } from "react";



export default function ClientWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [value, setValue] = useState("");

    const currentPage = Number(searchParams.get("page")) || 1;
    const currentFilters = useMemo(() => ({
        categoryId: searchParams.get("categoryId") || "",
        price: searchParams.get("price") || "",
        exchange: searchParams.get("exchange") || "",
        filter: searchParams.get("filter") || "",
        page: currentPage,
        limit: searchParams.get("limit") || 15,
        value: searchParams.get("value") || ""
    }), [searchParams, currentPage]);


    const handleFilterChange = (newFilterParams: any = {}) => {
        const updatedFilters = { ...currentFilters, ...newFilterParams, page: 1 };

        const cleanParams = Object.fromEntries(
            Object.entries(updatedFilters).filter(
                ([_, v]) => v !== "" && v !== null && v !== undefined && v !== "-1"
            )
        );

        const queryString = qs.stringify(cleanParams, { encode: true });
        router.push(`${pathname}?${queryString}`, { scroll: true });
    };


    const appendToFilter = (field: string, value: any) => {
        let current: Record<string, any> = {}
        if (currentFilters?.filter) {
            try { current = JSON.parse(String(currentFilters.filter)) || {} } catch { current = {} }
        }

        if (value === "" || value == null) {
            delete current[field]
        } else {
            current[field] = value
            handleFilterChange({ filter: JSON.stringify(current) })
        }
    };

    const activeFilters = useMemo(() => {
        try {
            return currentFilters.filter
                ? JSON.parse(currentFilters.filter)
                : {};
        } catch {
            return {};
        }
    }, [currentFilters.filter]);



    return (
        <div className="w-full flex flex-col border-r border-[var(--border)] min-h-screen  px-4 bg-[var(--background-soft)] transition-all duration-300">
            <CategorySection />
            <div className="border-b border-[var(--border)] py-6 space-y-6">
                <div className="space-y-6">
                    {/* SEARCH INPUT */}
                    <div className="space-y-3">
                        <SectionHeader title="Search" />
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="w-full h-11 px-3 flex items-center gap-2"
                        >
                            <input
                                type="text"
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Search items..."
                            />
                            <button type="submit"
                                onClick={() => handleFilterChange({ search: value })}
                                className="btn-primary !w-[35px] !h-[35px] !rounded-xl !px-0 shrink-0"
                                aria-label="Search">
                                <IoSearch className="text-base" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* CHECKBOX FILTERS */}
            <div className="flex flex-col gap-3.5 border-b border-[var(--border)] py-6">
                <label htmlFor="exchange_control"
                    className="flex items-center justify-between group cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[var(--background-soft)] text-[var(--foreground-muted)] group-hover:text-[var(--destructive)] dark:group-hover:text-[var(--label-color)] transition-colors duration-200">
                            <FaExchangeAlt className="text-sm" />
                        </div>
                        <span className="block w-[100px] text-[var(--foreground)] group-hover:text-[var(--primary-500)] dark:group-hover:text-[var(--label-color)] font-medium text-sm transition-colors duration-200">
                            Exchangeable
                        </span>
                    </div>
                    <input
                        id="exchange_control"
                        onChange={(e) => handleFilterChange({ exchange: e.target.checked ? "true" : "" })}
                        checked={!!currentFilters?.exchange}
                        name="exchange"
                        type="checkbox"
                        className="!w-4 !h-4 rounded border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                    />
                </label>

                <label htmlFor="photo_control" className="flex items-center justify-between group cursor-pointer select-none">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[var(--background-soft)] text-[var(--foreground-muted)] group-hover:text-[var(--destructive)] dark:group-hover:text-[var(--label-color)] transition-colors duration-200">
                            <FaPhotoVideo className="text-sm" />
                        </div>
                        <span className="text-[var(--foreground)] group-hover:text-[var(--primary-500)] dark:group-hover:text-[var(--label-color)] block w-[100px] font-medium text-sm transition-colors duration-200">
                            Photos Only
                        </span>
                    </div>
                    <input
                        id="photo_control"
                        type="checkbox"
                        className="!w-4 !h-4 rounded border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                    />
                </label>
            </div>

            <div className="py-4">
                <Options
                    categoryId={currentFilters.categoryId}
                    appendToFilter={appendToFilter}
                    activeFilters={activeFilters}
                />
            </div>
        </div>
    );
}