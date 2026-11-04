import React from "react";
import DashboardClient from "@/components/dashboard/layouts/DashboardClient"

export default function DashboardUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <DashboardClient>{children}</DashboardClient>
  );
}
