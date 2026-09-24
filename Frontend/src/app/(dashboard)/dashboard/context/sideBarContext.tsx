"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  /** true below the lg breakpoint — the sidebar is an overlay drawer there */
  isMobile: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const MOBILE_QUERY = "(max-width: 1023px)";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const apply = () => {
      setIsMobile(media.matches);
      // phones start with the drawer closed, desktops with the full sidebar
      setIsOpen(!media.matches);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, isMobile, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
