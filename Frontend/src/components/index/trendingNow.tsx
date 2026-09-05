import Link from "next/link";
import ListingsCarousel from "./ListingCarousel";
import { ListingProps } from "@/types/Listings";

export default function TrendingNow({ listings }: { listings: ListingProps[] }) {
  const sorted = [...(listings || [])]
    .sort((a, b) => (b?.metrics?.views || 0) - (a?.metrics?.views || 0))
    .slice(0, 12);

  if (sorted.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 mb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Trending Now</h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Getting the most attention from buyers today.</p>
          </div>
          <Link href="/posts?sort=views" className="text-xs font-bold bg-[var(--background-soft)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group">
            View All <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <ListingsCarousel listings={sorted} />
      </div>
    </section>
  );
}