"use client";

import DashboardShell from "./DashboardShell";
import { SellerSidebar } from "../components/(seller)/Sidebar";
export default function SellerDashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      sidebar={(isOpen) => <SellerSidebar isOpen={isOpen} />}
      requireRole="SELLER"
      redirectTo="/dashboard"
    >
      {children}
    </DashboardShell>
  );
}