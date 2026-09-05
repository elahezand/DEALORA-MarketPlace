import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPinned } from "lucide-react";
import { getUrl } from "@/utils/helper"
import { ListingProps } from "@/types/Listings";

interface SimilarListingProps {
    listings: ListingProps[];
}

export default function SimilarListing({ listings }: SimilarListingProps) {
    if (!listings || listings.length === 0) return null;

    return (
        <div className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5 text-[var(--foreground)] opacity-90">
                Similar listings
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 min-w-0">
                {listings.map((item) => {
                    const itemId = item._id;
                    const imageUrl = item.images?.[0];
                    const src = getUrl(imageUrl)

                    return (
                        <Link
                            key={itemId}
                            href={`/posts/${itemId}`}
                            className="card cursor-pointer overflow-hidden min-w-0 flex flex-col group transition-all duration-200 hover:shadow-md"
                        >
                            <div className="aspect-[4/3] bg-[var(--background-soft)] border-b border-[var(--border)] relative flex items-center justify-center overflow-hidden">
                                {imageUrl ? (
                                    <Image
                                        src={src || ""}
                                        alt={item.title || "Listing image"}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-4xl select-none transition-transform duration-300 group-hover:scale-105">
                                        📦
                                    </span>
                                )}
                            </div>

                            <div className="p-4 flex flex-col flex-grow justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold leading-snug line-clamp-2 text-[var(--foreground)] mb-1 group-hover:text-[var(--primary-600)] transition-colors">
                                        {item.title}
                                    </p>

                                    <p className="text-sm font-bold text-[var(--primary-600)] dark:text-[var(--accent-400)] tabular-nums">
                                        ${item.price?.toLocaleString() ?? 0}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {item.location?.city && (
                                        <div className="flex items-center gap-1 text-[10px] text-[var(--foreground-subtle)] font-medium">
                                            <MapPinned size={11} className="text-[var(--foreground-subtle)]" />
                                            <span>{item.location.city}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/40">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--neutral-900)] dark:text-[var(--accent-300)] border border-[var(--border)]">
                                            {item.condition || "Used"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}