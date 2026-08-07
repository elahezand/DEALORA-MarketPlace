"use client"
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiOutlinePhoto, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { ListingProps } from "@/types/Listings";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

type Props = {
    listings: ListingProps[];
};

function formatPrice(price: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(price);
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function ListingsSection({ listings }: Props) {
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const handleImageError = (itemId: string, index: number) => {
        setImageErrors((prev) => ({ ...prev, [`${itemId}_${index}`]: true }));
    };

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
            {listings.map((item) => {
                const title = item?.title || "Untitled";
                const images = item?.images || [];
                const condition = item.condition || "new";

                return (
                    <Link
                        href={`/posts/${item._id}`}
                        key={item._id}
                        className="group relative flex flex-row items-stretch
                                   border border-[var(--border)] rounded-[var(--radius)]
                                   bg-[var(--card)] dark:bg-[var(--card-solid)]
                                   shadow-[var(--card-shadow-1)] hover:shadow-[var(--card-shadow-hover)]
                                   transition-all duration-300 ease-in-out hover:-translate-y-0.5
                                   overflow-hidden h-[180px] p-2"
                        aria-label={title}
                    >
                        {/* ── IMAGE —  */}
                        <div className="relative w-[140px] shrink-0 h-full">
                            <Swiper
                                modules={[Pagination, EffectFade, Autoplay]}
                                effect="fade"
                                className="w-full h-full rounded-lg"
                                loop={images.length > 1}
                                fadeEffect={{ crossFade: true }}
                                speed={600}
                                autoplay={images.length > 1 ? { delay: 3500, disableOnInteraction: false } : false}
                                pagination={images.length > 1 ? { clickable: true } : false}
                            >
                                {images.length > 0 ? (
                                    images.map((image, idx) => {
                                        const hasError = imageErrors[`${item._id}_${idx}`];
                                        return (
                                            <SwiperSlide key={idx} className="w-full h-full">
                                                {!hasError ? (
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={image}
                                                            alt={`${title}-photo-${idx + 1}`}
                                                            unoptimized
                                                            fill
                                                            loading="lazy"
                                                            onError={() => handleImageError(item._id, idx)}
                                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative h-full w-full flex flex-col items-center justify-center gap-1
                                                                    bg-gradient-to-br from-[var(--neutral-50)] to-[var(--neutral-100)]
                                                                    dark:from-[var(--neutral-900)] dark:to-[var(--neutral-950)] overflow-hidden">
                                                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]
                                                                        bg-[radial-gradient(#000_1px,transparent_1px)]
                                                                        dark:bg-[radial-gradient(#fff_1px,transparent_1px)]
                                                                        [background-size:16px_16px]" />
                                                        <div className="p-2 rounded-xl bg-[var(--neutral-0)] dark:bg-[var(--neutral-800)]
                                                                        border border-[var(--destructive-bg)] text-[var(--destructive)]">
                                                            <HiOutlineExclamationTriangle size={18} />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--destructive)] opacity-90">
                                                            Error
                                                        </span>
                                                    </div>
                                                )}
                                            </SwiperSlide>
                                        );
                                    })
                                ) : (
                                    <SwiperSlide className="w-full h-full">
                                        <div className="relative h-full w-full flex flex-col items-center justify-center gap-1
                                                        bg-gradient-to-br from-[var(--neutral-50)] to-[var(--neutral-100)]
                                                        dark:from-[var(--neutral-900)] dark:to-[var(--neutral-950)] overflow-hidden">
                                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]
                                                            bg-[radial-gradient(#000_1px,transparent_1px)]
                                                            dark:bg-[radial-gradient(#fff_1px,transparent_1px)]
                                                            [background-size:16px_16px]" />
                                            <div className="p-2 rounded-xl bg-[var(--neutral-0)] dark:bg-[var(--neutral-800)]
                                                            border border-[var(--border)] text-[var(--foreground-muted)]
                                                            group-hover:text-[var(--primary-500)] dark:group-hover:text-[var(--accent-400)]
                                                            transition-all duration-300">
                                                <HiOutlinePhoto size={18} />
                                            </div>
                                            <span className="text-[9px] font-bold tracking-wider uppercase opacity-60">
                                                No image
                                            </span>
                                        </div>
                                    </SwiperSlide>
                                )}
                            </Swiper>

                            {/* Condition badge */}
                            <div className="absolute top-0 left-2 z-10">
                                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase
                                                 rounded-md backdrop-blur-md bg-[var(--destructive)]
                                                 text-white shadow-sm">
                                    {condition}
                                </span>
                            </div>
                        </div>

                        {/* ── DETAILS —── */}
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
                                    {formatPrice(item.price)}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    {item.location?.city && (
                                        <span className="text-[11px] text-[var(--foreground-muted)] font-medium truncate">
                                            📍 {item.location.city}
                                        </span>
                                    )}
                                    <div className="text-[11px] font-medium text-[var(--foreground-muted)] flex items-center gap-1 ml-auto shrink-0">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--success-500)] animate-pulse" />
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