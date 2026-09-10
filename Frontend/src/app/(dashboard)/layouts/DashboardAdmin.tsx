"use client";

import { AdminSidebar } from "../components/(admin)/Sidebar";
import DashboardShell from "./DashboardShell";
export default function AdminDashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      sidebar={(isOpen) => <AdminSidebar isOpen={isOpen} />}
      requireRole="ADMIN"
      redirectTo="/dashboard"
    >
      {children}
    </DashboardShell>
  );
}