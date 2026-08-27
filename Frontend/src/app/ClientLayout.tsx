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
          className="
      absolute inset-0
      pointer-events-none
      opacity-70
      dark:opacity-30
      [--bg-glow-1:var(--primary-800)]
      [--bg-glow-2:var(--primary-50)]
      dark:[--bg-glow-1:var(--primary-950)]
      dark:[--bg-glow-2:var(--primary-900)]
    "
          animate={{
            background: [
              "radial-gradient(circle at 15% 15%, var(--bg-glow-1) 0%, transparent 55%)",
              "radial-gradient(circle at 85% 85%, var(--bg-glow-2) 0%, transparent 55%)",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          aria-hidden
        />

        {children}
      </div>

      {showFooter && <Footer />}
    </>
  );
}