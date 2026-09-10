"use client";

import clsx from "clsx";
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
  const { isOpen } = useSidebar();

  const content = (
    <>
      {sidebar(isOpen)}
      <main
        className={clsx(
          "transition-all duration-300 pt-4 px-6 min-h-[calc(100vh-64px)]",
          isOpen ? "ml-72" : "ml-20"
        )}
      >
        {children}
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