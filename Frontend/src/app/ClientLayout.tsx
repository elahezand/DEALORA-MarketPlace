"use client";

import { usePathname } from "next/navigation";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { useEffect, useState } from "react";
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
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <div className="page min-h-screen flex flex-col relative [overflow:clip] antialiased">
        <div className="page-glow" aria-hidden="true">
          <span className="page-glow-a" />
          <span className="page-glow-b" />
        </div>

        <main id="main-content" className="flex-1 flex flex-col relative w-full">
          {children}
        </main>
      </div>

      {showFooter && <Footer />}
    </>
  );
}