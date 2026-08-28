import { MotionDiv } from "../../utils/providers/MotionWrapper";
import { Suspense } from "react";
import { useServerData } from "@/utils/hooks/useServerData";
import Link from "next/link";
import UnderlineWord from "@/components/index/underlineWord";
import LocationSearch from "@/components/index/locationSearch";
import CategoriesSection from "@/components/index/categorySection";
import ListingsCarousel from "@/components/index/ListingCarousel";
import PopularCities from "@/components/index/popularCities";
import StatsBar from "@/components/index/statsBar";
import HowItWorks from "@/components/index/howItWorks";
import AppDownloadBanner from "@/components/index/appDownloadBanner";
import DiscoverTabs from "@/components/index/discoversTabs";
import Section from "@/components/index/section";
import SectionHeader from "@/components/index/sectionHeader";
import HeroLiveBadge from "@/components/index/heroLiveBadge";
import VerifiedStores from "@/components/index/verifiedStores";
export default async function Page() {
  const data = await useServerData<any>(
    "/listings?limit=20",
    "all-listings",
    60
  );

  const allListings = data?.data || [];

  const storeProducts = allListings.filter((item: any) => item.listingType === "store_product");
  const userAds = allListings.filter((item: any) => item.listingType === "user_ad");


  return (
    <div className="w-full min-h-screen relative overflow-x-hidden">
      <section
        className="w-full px-4 sm:px-6 lg:px-8 mb-20 pb-4 flex flex-col items-center text-center pt-10 relative"
        style={{ background: "var(--background)" }}
      >
        {/* AMBIENT BACKGROUND GLOW — single, restrained, primary-only */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary-500/[0.07] dark:bg-primary-500/[0.10] blur-[100px]" />
        </div>
 
        <div className="w-full max-w-4xl mx-auto">
 
          <MotionDiv
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="flex flex-col items-center gap-6"
          >
            {/* HERO BADGE — live from /stats */}
            <HeroLiveBadge />
 
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
              relative z-30
              w-full
              p-2
              bg-[var(--card-solid)]
              backdrop-blur-xl
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
          </MotionDiv>
 
          <PopularCities />
 
        </div>
      </section>
      {/* ── DISCOVERY BAND (soft tone): Stats + Categories ── */}
      <div className="bg-[var(--background-soft)] border-y border-[var(--border)]">
        <Section tone="soft" maxWidth="5xl">
          <StatsBar />
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
            <CategoriesSection />
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
        />
        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={storeProducts} />
        </Suspense>
 
        {/* VERIFIED STORES — compact clickable entry point to /stores */}
        <div className="mt-6">
          <VerifiedStores />
        </div>
      </Section>
 
      {/* ── DISCOVER TABS (soft tone): Best Sellers / Trending / Free Shipping / Brand New ── */}
      <Section tone="soft">
        <DiscoverTabs listings={allListings} />
      </Section>
 
      {/* ── CLASSIFIED ADS (base tone) ── */}
      <Section tone="base">
        <SectionHeader
          eyebrow="Peer to Peer"
          icon="🤝"
          title="Classified Ads"
          subtitle="Direct peer-to-peer deals from community members near you."
          linkHref="/posts?listingType=user_ad"
          linkLabel="View Feed"
        />
        <Suspense fallback={<CarouselSkeleton />}>
          <ListingsCarousel listings={userAds} />
        </Suspense>
      </Section>
 
      {/* ── HOW IT WORKS (soft tone) ── */}
      <Section tone="soft">
        <HowItWorks />
      </Section>
 
      {/* ── PREMIUM SELL CTA (brand-tinted card, tone-independent) ── */}
      <Section tone="base">
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
      </Section>
 
      {/* ── APP DOWNLOAD (soft tone, quiet close) ── */}
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
 