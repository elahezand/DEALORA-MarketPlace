import { MotionDiv } from "../../utils/providers/MotionWrapper";
import { Suspense } from "react";
import Link from "next/link";
import LocationSearch from "@/components/index/locationSearch";
import CategoriesSection from "@/components/index/categorySection";
import ListingsCarousel from "@/components/index/ListingCarousel";
import PopularCities from "@/components/index/popularCities";
import { useServerData } from "@/utils/hooks/useServerData";
import ListingsTypeResponse  from "@/types/Listings";

export default async function Page() {
  const data = await useServerData<ListingsTypeResponse>(
    "/listings?limit=20",
    "all-listings",
    60
  );

  const allListings = data?.data.data || [];

  const storeProducts = allListings.filter((item: any) => item.listingType === "store_product");
  const userAds = allListings.filter((item: any) => item.listingType === "user_ad");

  return (
    <div className="w-full min-h-screen relative overflow-x-hidden">
      {/* ── HERO SECTION ── */}
      <section
        className="w-full px-4 sm:px-6 lg:px-8 mb-54 pb-4 flex flex-col items-center text-center pt-10"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-4xl mx-auto">

          <MotionDiv
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="flex flex-col items-center gap-5"
          >

            {/* HERO BADGE */}
            <div
              className="
          inline-flex items-center gap-2
          px-4 py-1.5
          rounded-full
          text-xs
          font-semibold
          bg-primary-50
          dark:bg-primary-950/60
          border
          border-primary-200
          dark:border-primary-800
          text-primary-600
          dark:text-primary-400
          backdrop-blur-md
          shadow-sm
        "
            >
              <span
                className="
            w-2 h-2
            rounded-full
            bg-primary-600
            dark:bg-primary-400
            animate-pulse
          "
              />

              Over 12,000+ items listed today
            </div>


            {/* HERO TITLE */}
            <h1
              className="
          text-4xl
          sm:text-5xl
          md:text-6xl
          font-bold
          tracking-tight
          leading-[1.1]
          max-w-2xl
          text-gradient-animated
        "
            >
              Buy &amp; sell anything,
              <br />

              {/* NEW */}
              <span className="relative inline-block px-2 mx-1">
                <span
                  className="
              absolute
              inset-0
              bg-primary-100
              dark:bg-primary-950/70
              -skew-x-6
              rounded-md
              -z-10
            "
                />

                <span
                  className="
              text-primary-700
              dark:text-primary-400
            "
                >
                  New
                </span>
              </span>

              or

              {/* USED */}
              <span className="relative inline-block px-2 mx-1">
                <span
                  className="
              text-destructive
              dark:text-red-400
            "
                >
                  Used
                </span>
              </span>
            </h1>


            {/* SUBTITLE */}
            <p
              className="
          text-sm
          sm:text-base
          text-[var(--foreground-muted)]
          max-w-md
          font-normal
          mb-12
        "
            >
              The smartest way to clear space and find incredible deals
              in your neighborhood.
            </p>

          </MotionDiv>


          {/* SEARCH */}
          <MotionDiv
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
            className="
        w-full
        p-2
        bg-[var(--card-solid)]
        backdrop-blur-xl
        border
        border-primary-200
        dark:border-primary-800
        rounded-[calc(var(--radius)+8px)]
        shadow-lg
        hover:shadow-xl
        transition-shadow
        duration-300
        mt-8
      "
          >
            <LocationSearch />
          </MotionDiv>

          <PopularCities />

        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-32">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Explore by category</h2>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Whatever you are looking for, we've got it covered.</p>
            </div>
            <Link href="/posts" className="text-xs font-bold bg-[var(--background-soft)] px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-all flex items-center gap-1.5 group">
              See all Categories <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection />
          </Suspense>
        </div>
      </section>

      {/* ── 1.(Official Stores) ── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-32">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </section>

      {/* ── 2. Classified Ads) ── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-32">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </section>

      {/* ── PREMIUM SELL CTA── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-32">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col gap-3 text-center md:text-left z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                <div className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Earn cash from your clutter</div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Ready to clear out some space?</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">List your items in under 2 minutes for free. Our AI smart search will match your product with local buyers instantly.</p>
            </div>
            <Link href="/posts/new" className="relative z-10 px-8 py-3 rounded-lg font-bold
                   bg-primary-600 dark:bg-primary-500
                   text-white shadow-lg
                   hover:bg-primary-700 dark:hover:bg-primary-600
                   hover:shadow-2xl hover:-translate-y-0.5
                   active:translate-y-0
                   transition-all duration-200
                   flex items-center gap-2 whitespace-nowrap group">
              ✨ Start Selling Now
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
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