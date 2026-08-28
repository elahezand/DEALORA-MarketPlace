import Link from "next/link";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: string;
  linkHref?: string;
  linkLabel?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  linkHref,
  linkLabel = "View All",
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
          {icon && <span className="text-lg">{icon}</span>}
          {eyebrow}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{title}</h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">{subtitle}</p>
        )}
      </div>

      {linkHref && (
        <Link
          href={linkHref}
          className="shrink-0 text-xs font-bold bg-[var(--card-solid)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group"
        >
          {linkLabel} <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      )}
    </div>
  );
}