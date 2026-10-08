"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiOutlinePhoto, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { ListingProps } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { getListingPrice } from "@/utils/price";
import { timeAgo } from "@/utils/timeAgo";

type Props = {
    listings: ListingProps[];
    /** how many of the first cards load their image eagerly (above the fold → LCP) */
    priorityCount?: number;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

/*
 * Performance notes (Lighthouse):
 *  - each card used to run its own Swiper (fade + autoplay + loop, which clones slides).
 *    With 3 carousels on the home page that was dozens of Swipers, ~80 running animations,
 *    seconds of main-thread work and a huge DOM. A card now shows ONE image.
 *  - the image box is 140px wide, but `sizes` said 25–50vw, so the browser downloaded
 *    images 3–5x too large ("Improve image delivery").
 *  - hover effects only animate transform/opacity (compositor-only), not box-shadow.
 */
function CardImage({ src, alt, priority }: { src: string | null; alt: string; priority: boolean }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="relative h-full w-full flex flex-col items-center justify-center gap-1 rounded-lg
                            bg-gradient-to-br from-[var(--neutral-50)] to-[var(--neutral-100)]
                            dark:from-[var(--neutral-900)] dark:to-[var(--neutral-950)]">
                <div className={`p-2 rounded-xl bg-[var(--neutral-0)] dark:bg-[var(--neutral-800)] border
                                ${failed ? "border-[var(--destructive-bg)] text-[var(--destructive)]" : "border-[var(--border)] text-[var(--foreground-muted)]"}`}>
                    {failed ? <HiOutlineExclamationTriangle size={18} /> : <HiOutlinePhoto size={18} />}
                </div>
                <span className={`text-[9px] font-bold tracking-wider uppercase ${failed ? "text-[var(--destructive)]" : "opacity-60"}`}>
                    {failed ? "Error" : "No image"}
                </span>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="140px"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => setFailed(true)}
            className="object-cover rounded-lg transition-transform duration-500 ease-out group-hover:scale-105"
        />
    );
}

export default function ListingsSection({ listings, priorityCount = 0 }: Props) {
    if (!listings.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--foreground-muted)]">
                <HiOutlinePhoto size={32} className="opacity-40" />
                <p className="text-sm">No listings yet — be the first to post!</p>
            </div>
        );
    }

    return (
        <>
            {listings.map((item, index) => {
                const title = item?.title || "Untitled";
                const firstImage = item?.images?.[0] ? getUrl(item.images[0]) : null;
                const imageCount = item?.images?.length || 0;
                const condition = item.condition || "new";
                const hasRating = !!item.metrics?.reviewsCount;

                return (
                    <Link
                        href={`/posts/${item._id}`}
                        key={item._id}
                        className="group relative flex flex-row items-stretch
                                   border border-[var(--border)] rounded-[var(--radius)]
                                   bg-[var(--card)] dark:bg-[var(--card-solid)]
                                   shadow-[var(--card-shadow-1)]
                                   transition-transform duration-200 ease-out hover:-translate-y-0.5
                                   overflow-hidden h-[180px] p-2"
                        aria-label={title}
                    >
                        {/* IMAGE */}
                        <div className="relative w-[140px] shrink-0 h-full overflow-hidden rounded-lg">
                            <CardImage src={firstImage} alt={title} priority={index < priorityCount} />

                            <div className="absolute top-0 left-2 z-10">
                                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase
                                                 rounded-md bg-[var(--destructive)] text-white shadow-sm">
                                    {condition}
                                </span>
                            </div>

                            {hasRating && (
                                <div className="absolute top-0 right-2 z-10">
                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide
                                                     rounded-md bg-black/70 text-white shadow-sm flex items-center gap-0.5">
                                        <span className="text-amber-400">★</span>
                                        {(item.metrics?.score ?? 0).toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {imageCount > 1 && (
                                <span className="absolute bottom-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-md
                                                 bg-black/60 text-white text-[10px] font-semibold">
                                    +{imageCount - 1}
                                </span>
                            )}
                        </div>

                        {/* DETAILS */}
                        <div className="flex flex-col justify-between flex-1 min-w-0 p-3">
                            <h2 className="text-sm font-semibold text-[var(--foreground)]
                                           group-hover:text-[var(--primary-500)]
                                           dark:group-hover:text-[var(--accent-400)]
                                           transition-colors duration-200
                                           line-clamp-2 leading-snug">
                                {title}
                            </h2>

                            <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
                                <div className="text-[var(--primary-500)] dark:text-[var(--accent-400)] font-bold text-sm tracking-tight">
                                    {item.listingType === "store_product" && <span className="text-[11px] font-medium text-[var(--foreground-muted)] mr-1">From</span>}
                                    {priceFormatter.format(getListingPrice(item))}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    {item.location?.city && (
                                        <span className="text-[11px] text-[var(--foreground-muted)] font-medium truncate">
                                            📍 {item.location.city}
                                        </span>
                                    )}
                                    <div className="text-[11px] font-medium text-[var(--foreground-muted)] flex items-center gap-1 ml-auto shrink-0">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--success-500)]" />
                                        {item.createdAt ? timeAgo(item.createdAt) : "Unknown"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </>
    );
}
