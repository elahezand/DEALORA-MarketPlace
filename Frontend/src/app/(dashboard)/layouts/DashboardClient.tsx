"use client";

import { AppSidebar } from "../components/(user)/Sidebar";
import { useSidebar } from "../dashboard/context/sideBarContext";
import clsx from "clsx";

export default function DashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();
  return (
    <>
      <AppSidebar isOpen={isOpen} />
      <main
        className={clsx(
          "transition-all duration-300 pt-4 px-6 min-h-[calc(100vh-64px)]",
          isOpen ? "ml-72" : "ml-20"
        )}
      >
        {children}
      </main>
    </>
  );
}