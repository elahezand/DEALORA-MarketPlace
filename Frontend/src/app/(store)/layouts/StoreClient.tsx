"use client";
import { useState } from "react"
import { useGetProfile } from "@/services/Profile/getProfile";
import clsx from "clsx";

export default function StoreClient({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const { store, hasStore, isLoading } = useGetProfile();

    return (
        <div className="min-h-screen overflow-x-hidden">
            <main className={clsx(
                "transition-all duration-300 pt-4 px-6 min-h-[calc(100vh-64px)]",
                isOpen ? "ml-72" : "ml-20"
            )}>
                {children}
            </main>
        </div>
    );
}