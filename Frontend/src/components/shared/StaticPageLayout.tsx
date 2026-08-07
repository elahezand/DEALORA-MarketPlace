import { ReactNode } from "react";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="card p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent" />

        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm font-medium text-[var(--foreground-muted)] max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="prose-sm max-w-none space-y-6 text-sm leading-relaxed text-[var(--foreground-muted)] [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[var(--foreground)] [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
