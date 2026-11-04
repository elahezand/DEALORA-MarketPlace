"use client";

import { useState } from "react";
import { Clock3, Tag, PackageCheck, ChevronDown, ChevronUp, Store as StoreIcon, Loader2 } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { Offer } from "@/types/Offer";

/*
   lower sections of the listing page (ListingDetailsClient).
   presentational only — cart actions come from the parent.
*/

interface ListingOffersProps {
    title: string;
    offers: Offer[];
    onAddToCart: (offerId: string) => void;
    isAddingToCart: boolean;
    cartError: string | null;
}

export function ListingOffers({ title, offers: variantOffers, onAddToCart, isAddingToCart, cartError }: ListingOffersProps) {
    return (
        <div className="card p-6 space-y-4 w-full">
                        <SectionHeading icon={<StoreIcon size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title={title} />
                        <div className="divide-y divide-[var(--border)]">
                            {variantOffers.map((offer: Offer) => {
                                const storeName = typeof offer.store === "object" ? offer.store?.name : undefined;
                                const storeRating = typeof offer.store === "object" ? offer.store?.meta?.ratings : undefined;
                                const storeReviewsCount = typeof offer.store === "object" ? offer.store?.meta?.reviewsCount : undefined;
                                const displayPrice = offer.finalPrice;
                                return (
                                    <div key={offer._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[var(--foreground)]">{storeName || "Vendor"}</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-[var(--foreground-subtle)]">{offer.stock} in stock</span>
                                                {!!storeRating && (
                                                    <span className="text-xs text-[var(--foreground-subtle)] flex items-center gap-0.5">
                                                        <span aria-hidden>·</span>
                                                        <span className="text-amber-500">★</span>
                                                        {storeRating.toFixed(1)}
                                                        {!!storeReviewsCount && ` (${storeReviewsCount})`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {!!offer.discount && offer.discount > 0 && (
                                                    <span className="block text-xs font-medium text-[var(--foreground-subtle)] line-through">${offer.price.toLocaleString()}</span>
                                                )}
                                                <span className="block text-base font-extrabold text-[var(--foreground)]">${displayPrice.toLocaleString()}</span>
                                                {!!offer.discount && offer.discount > 0 && (
                                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                                        {offer.discount}% OFF
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onAddToCart(offer._id)}
                                                disabled={isAddingToCart || offer.stock === 0}
                                                className="h-9 px-4 text-xs font-bold rounded-lg btn-secondary bg-[var(--background-soft)] border-[var(--border)] hover:bg-[var(--border)] flex items-center gap-1.5"
                                            >
                                                {isAddingToCart && <Loader2 size={12} className="animate-spin" />}
                                                Buy Offer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {cartError && (
                            <p className="text-xs font-medium text-[var(--destructive)]">{cartError}</p>
                        )}
                    </div>
    );
}

interface ListingDescriptionProps {
    description: string;
    specs: Record<string, string | number | boolean>;
}

export function ListingDescription({ description, specs }: ListingDescriptionProps) {
    const [descExpanded, setDescExpanded] = useState(false);
    const isLongDescription = description.length > 320;
    const hasSpecs = Object.keys(specs).length > 0;

    return (
        <div className="card p-6 space-y-6 w-full">
                    <div className="space-y-3">
                        <SectionHeading icon={<Clock3 size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Description" />
                        <p className={`text-sm text-[var(--foreground-muted)] leading-[1.85] whitespace-pre-line font-medium ${!descExpanded && isLongDescription ? "line-clamp-5" : ""}`}>
                            {description}
                        </p>
                        {isLongDescription && (
                            <button
                                onClick={() => setDescExpanded((v) => !v)}
                                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-600)] dark:text-[var(--accent-400)] hover:underline transition-all duration-200"
                            >
                                {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
                            </button>
                        )}
                    </div>

                    {hasSpecs && (
                        <div className="border-t border-[var(--border)] pt-6 space-y-4">
                            <SectionHeading icon={<Tag size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Specifications" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {Object.entries(specs).map(([key, value]) => (
                                    <div key={key} className="flex rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                                        <div className="bg-[var(--background-soft)] w-1/3 px-3 py-2.5 text-xs font-bold text-[var(--foreground-muted)] capitalize flex items-center border-r border-[var(--border)]">
                                            {key.replace(/_/g, " ")}
                                        </div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] truncate flex items-center flex-1 bg-[var(--card-solid)]">
                                            {String(value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
    );
}

export function ProtectionNotice({ isStoreProduct }: { isStoreProduct: boolean }) {
    return (
        <div className="card p-4 flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                    <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
                        <div className="h-10 w-10 rounded-full bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                            <PackageCheck size={18} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" />
                        </div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)] leading-relaxed max-w-md m-0 p-0">
                            {isStoreProduct
                                ? "This order qualifies for official vendor fulfillment check and secure checkout guarantee."
                                : "Your payment is held securely until you confirm delivery. Learn more about our protection policy."}
                        </p>
                    </div>
                    <button className="btn-secondary h-9 px-4 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 bg-[var(--background-soft)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--border)]">
                        Details
                    </button>
                </div>
    );
}
