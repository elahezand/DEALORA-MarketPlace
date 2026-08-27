"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MotionDiv } from "./MotionWrapper";
import Logo from "@/components/shared/Logo";

const LoadingContext = createContext<{
  setIsLoading: (loading: boolean) => void;
}>({
  setIsLoading: () => { },
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {children}
      {isLoading && (
        <MotionDiv
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center"
        >
          <MotionDiv
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="flex items-center justify-center"
          >
            <Logo showText={false} className="w-100 h-100" />
          </MotionDiv>
        </MotionDiv>
      )}
    </LoadingContext.Provider>
  );
}