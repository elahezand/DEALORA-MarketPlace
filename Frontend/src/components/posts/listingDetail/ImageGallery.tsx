"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ImageGalleryProps {
    images: string[];
    title: string;
    price: number;
    isSaved: boolean;
    onSaveToggle: () => void;
}

export default function ImageGallery({
    images,
    title,
    isSaved,
    onSaveToggle,
}: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const displayImages = images.length > 0 ? images : ["/placeholder.png"];

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col justify-between">
            {/* MAIN IMAGE */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--background-soft)] border border-[var(--border)]">
                <Image
                    src={displayImages[selectedImage]}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-all duration-300"
                    priority
                />

                {/* ACTION BUTTONS (Share & Favorite) */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="p-2.5 rounded-full  backdrop-blur-md border border-[var(--border)] shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                        aria-label="Share listing"
                    >
                        <Share2 size={18} className="text-[var(--foreground-subtle)] hover:text-[var(--foreground)]" />
                    </button>

                    <button
                        type="button"
                        onClick={onSaveToggle}
                        className="p-2.5 rounded-full backdrop-blur-md border border-[var(--border)] shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                        aria-label="Save to favorites"
                    >
                        <Heart
                            size={18}
                            className={
                                isSaved
                                    ? "fill-red-500 text-red-500"
                                    : "text-[var(--foreground-subtle)] hover:text-red-500"
                            }
                        />
                    </button>
                </div>
            </div>

            {/* THUMBNAILS */}
            {displayImages.length > 1 && (
                <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-1">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200 ${
                                selectedImage === idx
                                    ? "border-[var(--primary-500)] scale-105 shadow-sm"
                                    : "border-[var(--border)] opacity-70 hover:opacity-100"
                            }`}
                        >
                            <Image
                                src={img}
                                alt={`${title} ${idx + 1}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}