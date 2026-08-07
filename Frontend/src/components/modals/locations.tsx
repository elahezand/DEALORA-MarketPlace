"use client";
import { useLocation } from "@/services/Location/getLocations";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@heroui/react";
type Props = {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
};

export default function LocationsModal({ isOpen, setIsOpen }: Props) {
    const [view, setView] = useState<"states" | "cities">("states");
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { data, isLoading } = useLocation()
    const states = useMemo(() => (data?.cities ?? []).map((d) => d.state), [data]);

    const citiesForState = useMemo(() => {
        if (!selectedState) return [];
        return (data?.cities ?? []).find((d) => d.state === selectedState)?.cities ?? [];
    }, [data, selectedState]);


    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("cities") ?? "";
        if (!raw) return;
        const arr = raw.split(",").map((s) => decodeURIComponent(s)).filter(Boolean);
        if (arr.length) setSelectedCities(new Set(arr));
    }, []);

    const toggleCity = (city: string, checked: boolean) => {
        setSelectedCities((prev) => {
            const next = new Set(prev);
            if (checked) next.add(city);
            else next.delete(city);
            return next;
        });
    };

    const resetSelection = () => setSelectedCities(new Set());

    const buildTargetUrl = () => {
        const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
        const ids = Array.from(selectedCities);
        const params = current;

        if (ids.length === 0) params.delete("cities");
        else params.set("cities", ids.map(encodeURIComponent).join(","));

        const qs = params.toString();
        return qs ? `/posts/?${qs}` : pathname;
    };

    const onConfirm = async () => {
        const target = buildTargetUrl();
        await router.push(target);
        setIsOpen(false)
    };

    if (!isOpen) return null;

    if (isLoading)
        return (
            <div className="rounded-xl p-6 w-full h-full shadow-md border bg-white mx-auto">
                <Skeleton
                    classNames={{
                        base: "animate-pulse bg-gray-200 dark:bg-gray-700",
                    }}
                    className="h-10 rounded"
                />
            </div>
        );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />
            <div
                className="relative z-10 w-full max-w-[800px] bg-[var(--card)] backdrop-blur-xl text-[var(--foreground)] border border-[var(--border)] rounded-[22px] p-6 max-h-[90vh] flex flex-col shadow-[var(--card-shadow-hover)] transition-all overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                    <h3 className="text-lg font-bold tracking-tight">
                        {view === "states" ? "Select State" : `Cities in ${selectedState}`}
                    </h3>
                    <div className="flex items-center gap-2">
                        {view === "cities" && (
                            <button
                                onClick={() => {
                                    setView("states");
                                    setSelectedState(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[var(--background-soft)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--border)] transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={resetSelection}
                            className="px-3 py-1.5 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-500)] text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                            Reset selection
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={false}
                            className="px-3 py-1.5 rounded-lg bg-[var(--success-bg)] text-[var(--success-500)] text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                        >
                            Confirm
                        </button>
                    </div>
                </div>

                <div className="mb-4 p-3 bg-[var(--background-soft)] border border-[var(--border)] rounded-xl text-xs">
                    <span className="font-semibold text-[var(--foreground-muted)] block mb-1">Target Preview:</span>
                    <div className="font-mono text-[var(--primary-400)] dark:text-[var(--accent-400)] break-all">{buildTargetUrl()}</div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                    {view === "states" ? (
                        <ul className="list-none p-0 m-0 space-y-2">
                            {states.length === 0 && (
                                <li className="p-4 text-center text-sm text-[var(--foreground-subtle)] bg-[var(--background-soft)] rounded-xl">
                                    No states found
                                </li>
                            )}
                            {states.map((st) => (
                                <li key={st} className="p-3.5 rounded-xl bg-[var(--background-soft)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-between transition-colors group">
                                    <div className="text-sm font-medium">{st}</div>
                                    <label className="relative flex items-center justify-center flex-shrink-0 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedState === st}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                if (checked) {
                                                    setSelectedState(st);
                                                    setTimeout(() => setView("cities"), 50);
                                                } else {
                                                    setSelectedState(null);
                                                }
                                            }}
                                            className="appearance-none !h-2 rounded-md border-2 border-[var(--input-border)] bg-[var(--background)] checked:bg-[var(--primary-400)] checked:border-[var(--primary-400)] dark:checked:bg-[var(--accent-400)] dark:checked:border-[var(--accent-400)] cursor-pointer transition-colors"
                                            aria-label={`Select ${st}`}
                                        />
                                        <svg
                                            className="absolute w-4 h-4 dark:text-white text-[var(--primary-600)]pointer-events-none opacity-0 peer-checked:opacity-100"
                                            style={{ opacity: selectedState === st ? 1 : 0 }}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="list-none p-0 m-0 space-y-2">
                            {citiesForState.length === 0 && (
                                <li className="p-4 text-center text-sm text-[var(--foreground-subtle)] bg-[var(--background-soft)] rounded-xl">
                                    No cities found
                                </li>
                            )}
                            {citiesForState.map((city: any, i: number) => (
                                <li
                                    key={`${selectedState}-${i}`}
                                    className="p-3.5 rounded-xl bg-[var(--background-soft)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-between transition-colors"
                                >
                                    <div className="text-sm font-medium">{city}</div>
                                    <label className="relative flex items-center justify-center flex-shrink-0 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCities.has(city)}
                                            onChange={(e) => toggleCity(city, e.target.checked)}
                                            className="appearance-none 
                                         !h-2 rounded-md border-2 border-[var(--input-border)] bg-[var(--background)] checked:bg-[var(--primary-400)] checked:border-[var(--primary-400)] dark:checked:bg-[var(--accent-400)] dark:checked:border-[var(--accent-400)] cursor-pointer transition-colors"
                                            aria-label={`Select city ${city}`}
                                        />
                                        <svg
                                            className="absolute w-4 h-4 dark:text-white text-[var(--primary-600)] pointer-events-none opacity-0"
                                            style={{ opacity: selectedCities.has(city) ? 1 : 0 }}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}