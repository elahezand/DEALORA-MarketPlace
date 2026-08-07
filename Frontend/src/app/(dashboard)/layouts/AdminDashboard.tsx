"use client";

import clsx from "clsx";
import { AdminSidebar } from "../components/(admin)/Sidebar";
import { useSidebar } from "../dashboard/context/sideBarContext";
import { AuthGuard } from "../components/shared/authGuard";

export default function AdminDashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <AuthGuard
      requireRole="ADMIN"
      redirectTo="/dashboard">
      {() => (
        <>
          <AdminSidebar isOpen={isOpen} />
          <main
            className={clsx(
              "transition-all duration-300 pt-4 px-6 min-h-[calc(100vh-64px)]",
              isOpen ? "ml-72" : "ml-20"
            )}
          >
            {children}
          </main>
        </>
      )}
    </AuthGuard>
  );
}