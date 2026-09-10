"use client";

import { AppSidebar } from "../components/(user)/Sidebar";
import DashboardShell from "./DashboardShell";
export default function DashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      sidebar={(isOpen) => <AppSidebar isOpen={isOpen} />}
      requireRole="USER"
      redirectTo="/"
    >
      {children}
    </DashboardShell>
  );
}