"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FaPhotoVideo, FaExchangeAlt } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { useState, useMemo, useEffect } from "react";
import qs from "qs";
import SectionHeader from "./sectionHeader";
import CategorySection from "./categorySection";
import Options from "./options/options";

export default function ClientWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const initialQ = searchParams.get("q") || "";
    const [value, setValue] = useState(initialQ);

    useEffect(() => {
        setValue(searchParams.get("q") || "");
    }, [searchParams]);

    const currentPage = Number(searchParams.get("page")) || 1;

    const currentFilters = useMemo(() => ({
        categoryId: searchParams.get("categoryId") || "",
        listingType: searchParams.get("listingType") || "",
        price: searchParams.get("price") || "",
        condition: searchParams.get("condition") || "",
        rating: searchParams.get("rating") || "",
        exchange: searchParams.get("exchange") || "",
        hasPhoto: searchParams.get("hasPhoto") || "",
        filter: searchParams.get("filter") || "",
        page: currentPage,
        limit: searchParams.get("limit") || 15,
        q: searchParams.get("q") || ""
    }), [searchParams, currentPage]);


    const [priceMin, priceMax] = useMemo(() => {
        const [min, max] = (currentFilters.price || "").split("-");
        return [min || "", max || ""];
    }, [currentFilters.price]);

    const [priceMinInput, setPriceMinInput] = useState(priceMin);
    const [priceMaxInput, setPriceMaxInput] = useState(priceMax);

    useEffect(() => {
        setPriceMinInput(priceMin);
        setPriceMaxInput(priceMax);
    }, [priceMin, priceMax]);

    const handleFilterChange = (newFilterParams: Record<string, any> = {}) => {
        const updatedFilters = { ...currentFilters, ...newFilterParams, page: 1 };

        const cleanParams = Object.fromEntries(
            Object.entries(updatedFilters).filter(
                ([_, v]) => v !== "" && v !== null && v !== undefined && v !== "-1"
            )
        );

        const queryString = qs.stringify(cleanParams, { encode: true });
        router.push(`${pathname}?${queryString}`, { scroll: true });
    };

    const applyPriceFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const min = priceMinInput.trim();
        const max = priceMaxInput.trim();
        const priceValue = min && max ? `${min}-${max}` : min ? `${min}-` : max ? `-${max}` : "";
        handleFilterChange({ price: priceValue });
    };

    const appendToFilter = (field: string, val: any) => {
        let current: Record<string, any> = {};
        if (currentFilters?.filter) {
            try {
                current = JSON.parse(String(currentFilters.filter)) || {};
            } catch {
                current = {};
            }
        }

        if (val === "" || val == null) {
            delete current[field];
        } else {
            current[field] = val;
        }

        handleFilterChange({ filter: Object.keys(current).length ? JSON.stringify(current) : "" });
    };

    const activeFilters = useMemo(() => {
        try {
            return currentFilters.filter ? JSON.parse(currentFilters.filter) : {};
        } catch {
            return {};
        }
    }, [currentFilters.filter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange({ q: value });
    };

    return (
        <div className="w-full flex flex-col border-r border-[var(--border)] min-h-screen px-4  transition-all duration-300">
            <CategorySection />
            <div className="border-b border-[var(--border)] py-6 space-y-6">
                <div className="space-y-6">
                    {/* SEARCH INPUT */}
                    <div className="space-y-3">
                        <SectionHeader title="Search" />
                        <form
                            onSubmit={handleSearchSubmit}
                            className="w-full h-11 px-3 flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Search items..."
                                className="w-full h-full bg-transparent outline-none text-sm text-[var(--foreground)]"
                            />
                            <button
                                type="submit"
                                className="btn-primary !w-[35px] !h-[35px] !rounded-xl !px-0 shrink-0 flex items-center justify-center"
                                aria-label="Search"
                            >
                                <IoSearch className="text-base" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {/* CHECKBOX FILTERS */}
            <div className="flex flex-col gap-3.5 border-b border-[var(--border)] py-6">
                <label
                    htmlFor="exchange_control"
                    className="flex items-center justify-between group cursor-pointer select-none"
                >
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
                        checked={currentFilters.exchange === "true"}
                        name="exchange"
                        type="checkbox"
                        className="!w-4 !h-4 rounded border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                    />
                </label>

                <label
                    htmlFor="photo_control"
                    className="flex items-center justify-between group cursor-pointer select-none"
                >
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
                        onChange={(e) => handleFilterChange({ hasPhoto: e.target.checked ? "true" : "" })}
                        checked={currentFilters.hasPhoto === "true"}
                        className="!w-4 !h-4 rounded border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                    />
                </label>
            </div>

            {/* PRICE RANGE */}
            <div className="flex flex-col gap-3 border-b border-[var(--border)] py-6">
                <SectionHeader title="Price Range" />
                <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Min"
                        value={priceMinInput}
                        onChange={(e) => setPriceMinInput(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
                    />
                    <span className="text-[var(--foreground-subtle)] text-sm shrink-0">–</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Max"
                        value={priceMaxInput}
                        onChange={(e) => setPriceMaxInput(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
                    />
                    <button
                        type="submit"
                        className="btn-primary !h-10 !w-10 !rounded-lg !px-0 shrink-0 flex items-center justify-center"
                        aria-label="Apply price filter"
                    >
                        <IoSearch className="text-sm" />
                    </button>
                </form>
            </div>

            {/* CONDITION */}
            <div className="flex flex-col gap-3 border-b border-[var(--border)] py-6">
                <SectionHeader title="Condition" />
                <div className="flex flex-col gap-2">
                    {[
                        { value: "", label: "Any" },
                        { value: "new", label: "New" },
                        { value: "used", label: "Used" },
                    ].map((opt) => (
                        <label
                            key={opt.value || "any"}
                            className="flex items-center gap-2.5 cursor-pointer select-none"
                        >
                            <input
                                type="radio"
                                name="condition"
                                checked={currentFilters.condition === opt.value}
                                onChange={() => handleFilterChange({ condition: opt.value })}
                                className="!w-4 !h-4 border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                            />
                            <span className="text-sm text-[var(--foreground)]">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* SELLER RATING */}
            <div className="flex flex-col gap-3 border-b border-[var(--border)] py-6">
                <SectionHeader title="Seller Rating" />
                <div className="flex flex-col gap-2">
                    {[
                        { value: "", label: "Any" },
                        { value: "4", label: "4★ & above" },
                        { value: "3", label: "3★ & above" },
                    ].map((opt) => (
                        <label
                            key={opt.value || "any"}
                            className="flex items-center gap-2.5 cursor-pointer select-none"
                        >
                            <input
                                type="radio"
                                name="rating"
                                checked={currentFilters.rating === opt.value}
                                onChange={() => handleFilterChange({ rating: opt.value })}
                                className="!w-4 !h-4 border-[var(--input-border)] bg-transparent text-[var(--ring)] accent-[var(--ring)] focus:ring-0 cursor-pointer"
                            />
                            <span className="text-sm text-[var(--foreground)]">{opt.label}</span>
                        </label>
                    ))}
                </div>
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