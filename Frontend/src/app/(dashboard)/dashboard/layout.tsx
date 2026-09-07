"use client";

import { AppHeader } from "../components/shared/Header";
import { SidebarProvider, useSidebar } from "./context/sideBarContext";
import { AuthGuard } from "../components/shared/authGuard";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <AuthGuard>
      {(user) => (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
          <AppHeader
            isOpen={isOpen}
            onToggle={toggleSidebar}
            user={user}
          />
          <div className="flex-1">
            {children}
          </div>
        </div>
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
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}