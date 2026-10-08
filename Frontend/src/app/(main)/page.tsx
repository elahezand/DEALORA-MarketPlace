import { Suspense } from "react";
import { useServerData } from "@/utils/hooks/useServerData";
import Link from "next/link";
import UnderlineWord from "@/components/index/underlineWord";
import LocationSearch from "@/components/index/locationSearch";
import CategoriesSection from "@/components/index/categorySection";
import ListingsCarousel from "@/components/index/ListingCarousel";
import PopularState from "@/components/index/popularState";
import StatsBar from "@/components/index/statsBar";
import HowItWorks from "@/components/index/howItWorks";
import AppDownloadBanner from "@/components/index/appDownloadBanner";
import DiscoverTabs from "@/components/index/discoversTabs";
import Section from "@/components/index/section";
import SectionHeader from "@/components/index/sectionHeader";
import HeroLiveBadge from "@/components/index/heroLiveBadge";
import VerifiedStores from "@/components/index/verifiedStores";
import { PublicListingsResponse } from "@/types/Listings";
import { CategoriesTypeResponse } from "@/types/Category";
import { GetPublicStatsResponse } from "@/services/Stats/useGetStats";
import { GetVerifiedStoresResponse } from "@/services/Store/useVerifyStore";

export default async function Page() {
  /*
   * Everything the page shows is fetched here, in parallel, on the server.
   * Before, categories / stats / verified stores were fetched by the browser after
   * hydration (HTML → JS → API chain, content popping in → layout shift).
   * The API returns at most 10 listings without a listingType, so the two kinds are
   * requested separately (the old "?limit=20" silently got 10 for both together).
   */
  const [storeData, adsData, categories, stats, verifiedStores] = await Promise.all([
    useServerData<PublicListingsResponse>("/listings?listingType=store_product&limit=12", "home-store-products", 60),
    useServerData<PublicListingsResponse>("/listings?listingType=user_ad&limit=12", "home-user-ads", 60),
    useServerData<CategoriesTypeResponse>("/categories", "categories", 60 * 60),
    useServerData<GetPublicStatsResponse>("/stats", "public-stats", 300),
    useServerData<GetVerifiedStoresResponse>("/stores/verified", "verified-stores-home", 300),
  ]);

  const storeProducts = storeData?.data || [];
  const userAds = adsData?.data || [];
  const allListings = [...storeProducts, ...userAds];


  return (
    <div className="w-full min-h-screen relative overflow-x-hidden">
      <section
        className="w-full px-4 sm:px-6 lg:px-8 mb-20 pb-4 flex flex-col items-center text-center pt-10 relative"
        style={{ background: "var(--background)" }}
      >
        {/* AMBIENT BACKGROUND GLOW — single, restrained, primary-only */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* radial-gradient instead of a 700px element with blur(100px): same look, a fraction of the paint cost */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.08)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgb(37_99_235/0.12)_0%,transparent_65%)]" />
        </div>

        <div className="w-full max-w-4xl mx-auto">

          {/* was <MotionDiv initial={{ y: -15, opacity: 0 }} ...> — now pure CSS */}
          <div className="fade-in-down flex flex-col items-center gap-6">
            {/* HERO BADGE — live from /stats */}
            <HeroLiveBadge initialStats={stats} />

            {/* HERO TITLE */}
            <h1
              className="
                text-4xl
                sm:text-5xl
                md:text-6xl
                font-bold
                tracking-tight
                leading-[1.2]
                max-w-2xl
                text-[var(--foreground)]
              "
            >
              Buy &amp; sell anything,
              <br />
              <UnderlineWord className="text-primary-600 dark:text-primary-400">
                New
              </UnderlineWord>
              {" or "}
              <UnderlineWord className="text-red-600 dark:text-red-400">
                Used
              </UnderlineWord>
            </h1>

            {/* SUBTITLE */}
            <p
              className="
                text-sm
                sm:text-base
                text-[var(--foreground-muted)]
                max-w-md
                font-normal
                mb-6
              "
            >
              The smartest way to clear space and find incredible deals
              in your neighborhood.
            </p>

          </div>


          {/* SEARCH — was <MotionDiv ... delay: 0.1> */}
          <div
            className="
              fade-in-up
              relative z-30
              w-full
              p-2
              bg-[var(--card-solid)]
              border
              border-[var(--border)]
              rounded-[calc(var(--radius)+8px)]
              shadow-lg
              hover:shadow-xl
              transition-shadow
              duration-300
              mt-8
            "
          >
            <LocationSearch />
          </div>
          <PopularState />
        </div>
      </section>
      {/* ── DISCOVERY BAND: Stats + Categories ── */}
      <div className="bg-[var(--background-soft)] border-y border-[var(--border)]">
        <Section tone="soft" maxWidth="5xl">
          <StatsBar initialStats={stats} />
        </Section>

        <Section tone="soft" maxWidth="5xl">
          <SectionHeader
            eyebrow="Browse"
            title="Explore by category"
            subtitle="Whatever you're looking for, we've got it covered."
            linkHref="/posts"
            linkLabel="See all Categories"
          />
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection initialData={categories} />
          </Suspense>
        </Section>
      </div>

      {/* ── OFFICIAL STORES (base tone) ── */}
      <Section tone="base">
        <SectionHeader
          eyebrow="Verified"
          icon="🏪"
          title="Official Brands & Stores"
          subtitle="Verified businesses with official warranty and secure shipping."
          linkHref="/posts?listingType=store_product"
          linkLabel="View All Stores"
          itemCount={storeProducts.length}
        />
        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={storeProducts} priorityCount={2} />
        </Suspense>

        {/* VERIFIED STORES — compact clickable entry point to /stores */}
        <div className="mt-6">
          <VerifiedStores initialStores={verifiedStores} />
        </div>
      </Section>

      {/* ── DISCOVER TABS (accent tone): Best Sellers / Trending / Free Shipping / Brand New ── */}
      <Section tone="accent">
        <DiscoverTabs listings={allListings} />
      </Section>

      {/* ── CLASSIFIED ADS*/}
      <Section tone="base">
        <SectionHeader
          eyebrow="Peer to Peer"
          icon="🤝"
          title="Classified Ads"
          subtitle="Direct peer-to-peer deals from community members near you."
          linkHref="/posts?listingType=user_ad"
          linkLabel="View Feed"
          itemCount={userAds.length}
        />
        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={userAds} />
        </Suspense>
      </Section>

      {/* ── HOW IT WORKS */}
      <Section tone="soft">
        <HowItWorks />
      </Section>

      {/* ── PREMIUM SELL CTA── */}
      <Section tone="base">
        <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col gap-3 text-center md:text-left z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 w-fit">
              <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
              <div className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Earn cash from your clutter</div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Ready to clear out some space?</h3>
            <p className="text-sm text-foreground-muted leading-relaxed">List your items in under 2 minutes for free. Our AI smart search will match your product with local buyers instantly.</p>
            <p className="text-sm text-foreground-muted">
              Selling more than a few items?{" "}
              <Link
                href="/create-shop"
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline underline-offset-2"
              >
                Open your own shop →
              </Link>
            </p>
          </div>
          <Link href="/posts/new" className="relative z-10 px-8 py-3 rounded-lg font-bold
                 w-full md:w-auto justify-center
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
      </Section>

      {/* ── APP DOWNLOAD ── */}
      <Section tone="soft">
        <AppDownloadBanner />
      </Section>
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