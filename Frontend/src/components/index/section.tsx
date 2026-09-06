import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  tone?: "base" | "soft" | "accent";
  maxWidth?: "5xl" | "7xl";
}

export default function Section({ children, tone = "base", maxWidth = "7xl" }: SectionProps) {
  const maxW = maxWidth === "5xl" ? "max-w-5xl" : "max-w-7xl";

  if (tone === "accent") {
    return (
      <section className="w-full py-14 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-primary-500/[0.04] dark:bg-primary-500/[0.05]">
        {/* Decorative blue glows to give this section its own identity */}
        <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary-400/[0.14] dark:bg-primary-500/[0.10] blur-[110px]" />
          <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-primary-600/[0.12] dark:bg-primary-400/[0.08] blur-[110px]" />
        </div>

        <div className={`${maxW} mx-auto relative z-10`}>{children}</div>
      </section>
    );
  }

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