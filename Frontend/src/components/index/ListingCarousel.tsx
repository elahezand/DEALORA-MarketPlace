"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import ListingsSection from "@/components/shared/listingSection";
import { ListingProps } from "@/types/Listings";

interface ListingsCarouselProps {
  listings: ListingProps[];
  /** eager-load the images of the first N cards (use on the first carousel above the fold) */
  priorityCount?: number;
}

/*
 * A native scroll-snap row instead of Swiper:
 *  - the card widths are plain CSS, so the server HTML already has the final layout
 *    (Swiper applied its breakpoints only after hydration → layout shift),
 *  - no Swiper JS / CSS on the home page, no measuring on every resize (forced reflow),
 *  - touch, trackpad and keyboard scrolling work natively.
 */
export default function ListingsCarousel({ listings, priorityCount = 0 }: ListingsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // scrollLeft is negative in RTL — use the absolute value
    const left = Math.abs(el.scrollLeft);
    setCanPrev(left > 4);
    setCanNext(left + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(updateButtons);
    el.addEventListener("scroll", updateButtons, { passive: true });
    const observer = new ResizeObserver(updateButtons);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", updateButtons);
      observer.disconnect();
    };
  }, [updateButtons, listings.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: direction * el.clientWidth * 0.9 * (isRtl ? -1 : 1), behavior: "smooth" });
  };

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--foreground-muted)]">
        No listings found in this category.
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4
                   [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
        role="list"
      >
        {listings.map((item, index) => (
          <div
            key={item._id}
            role="listitem"
            className="snap-start shrink-0 w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]"
          >
            <ListingsSection listings={[item]} priorityCount={index < priorityCount ? 1 : 0} />
          </div>
        ))}
      </div>

      {canPrev && (
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByPage(-1)}
          className="hidden sm:flex absolute left-0 top-[90px] -translate-x-1/2 -translate-y-1/2 z-10
                     w-10 h-10 items-center justify-center rounded-full border border-[var(--border)]
                     bg-[var(--card-solid)] text-[var(--foreground)] shadow-md
                     hover:scale-105 transition-transform"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByPage(1)}
          className="hidden sm:flex absolute right-0 top-[90px] translate-x-1/2 -translate-y-1/2 z-10
                     w-10 h-10 items-center justify-center rounded-full border border-[var(--border)]
                     bg-[var(--card-solid)] text-[var(--foreground)] shadow-md
                     hover:scale-105 transition-transform"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
