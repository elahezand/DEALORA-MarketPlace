"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useSidebar } from "../dashboard/context/sideBarContext";
import { AuthGuard, Role } from "./authGuard";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar: (isOpen: boolean) => React.ReactNode;
  requireRole?: Role | Role[];
  redirectTo?: string;
}

export default function DashboardShell({
  children,
  sidebar,
  requireRole,
  redirectTo,
}: DashboardShellProps) {
  const { isOpen, isMobile, closeSidebar } = useSidebar();
  const pathname = usePathname();

  // on phones the drawer closes itself after navigating
  useEffect(() => {
    if (isMobile) closeSidebar();
  }, [pathname, isMobile, closeSidebar]);

  // no background scrolling while the drawer is open on a phone
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const content = (
    <>
      {sidebar(isOpen)}

      {isMobile && isOpen && (
        <div
          className="dash-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <main
        id="main-content"
        className={clsx(
          "dash-main transition-[margin] duration-300",
          // the sidebar only pushes content on desktop; on phones it overlays
          isOpen ? "lg:ml-72" : "lg:ml-20"
        )}
      >
        <div className="dash-container">{children}</div>
      </main>
    </>
  );

  if (!requireRole) {
    return content;
  }

  return (
    <AuthGuard requireRole={requireRole} redirectTo={redirectTo}>
      {() => content}
    </AuthGuard>
  );
}
