import React from "react";
import SellerDashboardClient from "@/app/(dashboard)/layouts/DashboardSeller";
export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerDashboardClient>{children}</SellerDashboardClient>;
}