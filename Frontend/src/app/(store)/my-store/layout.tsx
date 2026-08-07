import React from "react";
import StoreClient from "../layouts/StoreClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <StoreClient>{children}</StoreClient>
  );
}
