import React from "react";
import AdminDashboardClient from "@/components/dashboard/layouts/DashboardAdmin";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AdminDashboardClient>{children}</AdminDashboardClient>)
}