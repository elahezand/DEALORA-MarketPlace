"use client";

import { AppHeader } from "../components/shared/Header";
import { SidebarProvider, useSidebar } from "./context/sideBarContext";
import { AuthGuard } from "../components/shared/authGuard";

function DashboardHeader() {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <AuthGuard>
      {(user) => (
        <AppHeader
          isOpen={isOpen}
          onToggle={toggleSidebar}
          user={user}
        />
      )}
    </AuthGuard>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <DashboardHeader />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}