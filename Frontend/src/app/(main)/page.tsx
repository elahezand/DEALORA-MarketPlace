import { MotionDiv } from "../../utils/providers/MotionWrapper";
import { Suspense } from "react";
import Link from "next/link";
import LocationSearch from "@/components/index/locationSearch";
import CategoriesSection from "@/components/index/categorySection";
import ListingsCarousel from "@/components/index/ListingCarousel"; 
import PopularCities from "@/components/index/popularCities";
import { useServerData } from "@/utils/hooks/useServerData";
import { ListingsTypeResponse } from "@/types/Listings";

export default async function Page() {
  const data = await useServerData<ListingsTypeResponse>(
    "/listings?limit=20",
    "all-listings",
    60
  );

  const allListings = data?.data || [];  

  const storeProducts = allListings.filter((item: any) => item.listingType === "store_product");

  const userAds = allListings.filter((item: any) => item.listingType === "user_ad");

  return (
    <div className="w-full mx-auto relative overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="w-full max-w-4xl mx-auto mb-24 flex flex-col items-center gap-8 text-center pt-10">
        <MotionDiv
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--background-soft)] border border-[var(--border-strong)] text-[var(--foreground)] backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-500)] animate-pulse" />
            Over 12,000+ items listed today
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--foreground)] leading-[1.1] max-w-2xl">
            Buy &amp; sell anything, <br />
            <span className="relative inline-block px-2 mx-1">
              <span className="absolute inset-0 bg-[var(--primary-100)] dark:bg-[var(--primary-900)]/50 -skew-x-6 rounded-md -z-10" />
              <span className="text-[var(--primary-600)] dark:text-[var(--primary-400)]">new</span>
            </span> 
            or 
            <span className="relative inline-block px-2 mx-1">
              <span className="absolute inset-0 bg-[var(--destructive-bg)] -skew-x-6 rounded-md -z-10" />
              <span className="text-[var(--destructive)]">used</span>
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-md font-medium">
            The smartest way to clear space and find incredible deals in your neighborhood.
          </p>
        </MotionDiv>

        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-3xl p-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border-strong)] rounded-[calc(var(--radius)+8px)] shadow-[var(--card-shadow-hover)]"
        >
          <LocationSearch />
        </MotionDiv>

        <PopularCities />
      </section>

      {/* ── CATEGORIES ── */}
      <section className="w-full max-w-5xl mx-auto mb-32">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Explore by category</h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Whatever you are looking for, we’ve got it covered.</p>
          </div>
          <Link href="/posts" className="text-xs font-bold bg-[var(--background-soft)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group">
            See all Categories <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesSection />
        </Suspense>
      </section>

      {/* ── ۱.(Official Stores) ── */}
      <section className="w-full max-w-7xl mx-auto mb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Official Brands &amp; Stores</h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Verified businesses with official warranty and secure shipping.</p>
          </div>
          <Link href="/posts?listingType=store_product" className="text-xs font-bold bg-[var(--background-soft)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group">
            View All Stores <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={storeProducts} />
        </Suspense>
      </section>

      {/* ── ۲. Classified Ads) ── */}
      <section className="w-full max-w-7xl mx-auto mb-32">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤝</span>
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Classified Ads</h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Direct peer-to-peer deals from community members near you.</p>
          </div>
          <Link href="/posts?listingType=user_ad" className="text-xs font-bold bg-[var(--background-soft)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group">
            View Feed <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={userAds} />
        </Suspense>
      </section>

      {/* ── PREMIUM SELL CTA ── */}
      <section className="w-full max-w-7xl mx-auto mb-32">
        <div className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--card-solid)] to-[var(--background-soft)] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[var(--card-shadow-1)]">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="flex flex-col gap-2 text-center md:text-left z-10 max-w-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--primary-500)]">Earn cash from your clutter</div>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">Ready to clear out some space?</h3>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">List your items in under 2 minutes for free. Our AI smart search will match your product with local buyers instantly.</p>
          </div>
          <Link href="/posts/new" className="btn-primary">
            Start Selling Now <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── SKELETONS ──

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-solid)]/40 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-[var(--border-strong)]/30" />
          <div className="h-3 w-16 rounded bg-[var(--border-strong)]/30" />
        </div>
      ))}
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-solid)]/40 animate-pulse">
          <div className="w-full aspect-square rounded-xl bg-[var(--border-strong)]/30" />
          <div className="h-4 w-3/4 rounded bg-[var(--border-strong)]/30 mt-2" />
          <div className="h-3 w-1/2 rounded bg-[var(--border-strong)]/20" />
        </div>
      ))}
    </div>
  );
}