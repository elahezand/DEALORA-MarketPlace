import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  tone?: "base" | "soft";
  maxWidth?: "5xl" | "7xl";
}

export default function Section({ children, tone = "base", maxWidth = "7xl" }: SectionProps) {
  const maxW = maxWidth === "5xl" ? "max-w-5xl" : "max-w-7xl";

  return (
    <section
      className={`w-full py-14 sm:py-16 px-4 sm:px-6 lg:px-8 ${
        tone === "soft" ? "bg-[var(--background-soft)]" : ""
      }`}
    >
      <div className={`${maxW} mx-auto`}>{children}</div>
    </section>
  );
}