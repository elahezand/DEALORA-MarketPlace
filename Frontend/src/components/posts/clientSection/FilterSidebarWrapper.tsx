"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import ClientWrapper from "./clientWrapper"
export default function FilterSidebarWrapper() {
    const [isOpen, setIsOpen] = useState(false)
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 h-11 px-4
                           rounded-full bg-[var(--primary-500)] dark:bg-[var(--accent-500)]
                           text-white text-sm font-semibold shadow-lg shadow-[var(--primary-500)]/20
                           active:scale-[0.98] transition-transform"
                aria-label="Open filters"
            >
                <SlidersHorizontal className="text-lg" />
                Filters
            </button>
            <aside className="sticky top-24 z-20 w-[350px] shrink-0 hidden md:block h-fit max-h-[calc(100vh-7rem)] overflow-y-auto self-start">
                <ClientWrapper />
            </aside>

            {/* MOBILE: slide-in drawer, only mounted while open */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="relative z-10 w-[85vw] max-w-[360px] h-full bg-[var(--card)]
                                   shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-14
                                        bg-[var(--card)] border-b border-[var(--border)]">
                            <span className="text-sm font-bold text-[var(--foreground)]">Filters</span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-full
                                           text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                                aria-label="Close filters"
                            >
                                <X className="text-lg" />
                            </button>
                        </div>
                        <div className="p-4">
                            <ClientWrapper />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}