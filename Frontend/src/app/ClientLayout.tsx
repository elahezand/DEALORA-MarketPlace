"use client";

import { usePathname } from "next/navigation";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { useEffect, useState } from "react";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
const noFooterRoutes = ["/login", "/register", "/create"];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(true);

  useEffect(() => {
    setShowFooter(!noFooterRoutes.includes(pathname));
  }, [pathname]);

  return (
    <>
      <Header />
      <div className="page min-h-screen flex flex-col relative [overflow:clip] antialiased">
        <MotionDiv
          className="absolute inset-0 pointer-events-none dark:opacity-25 [--bg-glow-1:var(--primary-100)] dark:[--bg-glow-1:var(--primary-600)] [--bg-glow-2:var(--accent-200)] dark:[--bg-glow-2:var(--accent-600)]"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, var(--bg-glow-1) 0%, transparent 60%)",
              "radial-gradient(circle at 80% 80%, var(--bg-glow-2) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          aria-hidden
        />
        {children}
      </div>

      {showFooter && <Footer />}
    </>
  );
}