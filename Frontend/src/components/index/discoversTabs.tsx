"use client";

import { useMemo, useState } from "react";
import ListingsCarousel from "./ListingCarousel";
import SectionHeader from "./sectionHeader";

type TabKey = "bestSellers" | "trending" | "freeShipping" | "brandNew";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "bestSellers", label: "Best Sellers", icon: "🔥" },
  { key: "trending", label: "Trending", icon: "📈" },
  { key: "freeShipping", label: "Free Shipping", icon: "🚚" },
  { key: "brandNew", label: "Brand New", icon: "✨" },
];

const TAB_HREFS: Record<TabKey, string> = {
  bestSellers: "/posts?sort=sold",
  trending: "/posts?sort=views",
  freeShipping: "/posts?shipping=free",
  brandNew: "/posts?condition=new",
};

export default function DiscoverTabs({ listings }: { listings: any[] }) {
  const [active, setActive] = useState<TabKey>("bestSellers");

  const lists = useMemo(() => {
    const source = listings || [];
    return {
      bestSellers: [...source]
        .sort((a, b) => (b?.metrics?.sold || 0) - (a?.metrics?.sold || 0))
        .slice(0, 12),
      trending: [...source]
        .sort((a, b) => (b?.metrics?.views || 0) - (a?.metrics?.views || 0))
        .slice(0, 12),
      freeShipping: source.filter((item: any) => item?.shipping?.type === "free"),
      brandNew: source.filter((item: any) => item?.condition === "new"),
    };
  }, [listings]);

  const activeList = lists[active];

  if (!listings || listings.length === 0) return null;

  return (
    <div>
      <SectionHeader
        eyebrow="Explore More"
        title="Discover"
        subtitle="Different ways to browse what's available right now."
        linkHref={TAB_HREFS[active]}
        linkLabel="View More"
        itemCount={activeList.length}
      />

      {/* TAB SWITCHER */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const count = lists[tab.key].length;
          if (count === 0) return null;

          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`
                px-4 py-2 rounded-full text-xs font-bold
                border transition-all
                flex items-center gap-1.5
                ${isActive
                  ? "bg-primary-600 dark:bg-primary-500 text-white border-primary-600 dark:border-primary-500"
                  : "bg-[var(--card-solid)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeList.length > 0 ? (
        <ListingsCarousel listings={activeList} />
      ) : (
        <p className="text-sm text-[var(--foreground-muted)] py-8 text-center">
          Nothing here yet — check back soon.
        </p>
      )}
    </div>
  );
}