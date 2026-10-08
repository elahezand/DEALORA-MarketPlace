"use client";
import { createContext, useContext, useState } from "react";
import Logo from "@/components/shared/Logo";

const LoadingContext = createContext<{
  setIsLoading: (loading: boolean) => void;
}>({
  setIsLoading: () => { },
});

export const useLoading = () => useContext(LoadingContext);

/*
 * The overlay now only shows when some code explicitly calls setIsLoading(true).
 * Before, it covered EVERY page for a fixed 1 second on every load and navigation
 * (full-screen backdrop blur + an infinite framer-motion spin): it delayed LCP,
 * cost main-thread time on each route change and pulled framer-motion into every page.
 */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {children}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading"
          className="fixed inset-0 bg-black/20 z-[9999] flex items-center justify-center"
        >
          <div className="animate-spin [animation-duration:2s]">
            <Logo showText={false} className="w-24 h-24" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
