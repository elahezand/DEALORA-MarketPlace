"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import { IoLocationOutline } from "react-icons/io5";
import { MdAddHomeWork } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Link from "next/link";
import { ListingProps } from "@/types/Listings";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

interface DetailSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ListingProps | null;
  reason?: string;
}

export default function DetailSearchModal({
  isOpen,
  onClose,
  post,
  reason,
}: DetailSearchModalProps) {
  if (!isOpen || !post) return null;

  const postImages = Array.isArray(post.images) ? post.images : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[20px] transition-opacity duration-300"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-[30px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl card border border-[var(--border)] text-[var(--foreground)]"
        style={{ background: "var(--card)", backdropFilter: "blur(20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[30px] bg-[var(--gradient)]" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border)] mt-1">
          <h2 className="text-xl font-bold flex items-center gap-2 font-sans">
            <MdAddHomeWork className="text-[var(--warning-500)] shrink-0" size={24} />
            <span className="tracking-tight text-[var(--foreground)] line-clamp-1">
              {post.title}
            </span>
          </h2>
          <Button
            variant="light"
            onPress={onClose}
            className="font-semibold text-[var(--destructive)] hover:bg-[var(--destructive-bg)] rounded-xl shrink-0"
          >
            Close
          </Button>
        </div>

        {/* AI Reason Highlight */}
        {reason && (
          <div
            className="p-4 rounded-2xl mb-5 text-sm font-medium border border-[var(--warning-500)]/20"
            style={{ background: "var(--warning-bg)", color: "var(--warning-500)" }}
          >
            <p className="font-bold mb-1 text-xs uppercase tracking-wider opacity-80">AI Suggestion Reason:</p>
            {reason}
          </div>
        )}

        {/* Image Gallery */}
        {postImages.length > 0 ? (
          <div className="relative h-64 mb-5 rounded-2xl overflow-hidden shadow-inner border border-[var(--border)]">
            <Swiper
              modules={[Autoplay, EffectFade, Pagination]}
              effect="fade"
              spaceBetween={50}
              slidesPerView={1}
              fadeEffect={{ crossFade: true }}
              className="h-full"
              loop={postImages.length > 1}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              speed={1000}
              pagination={{ clickable: true }}
            >
              {postImages.map((photo: string, index: number) => {
                const src = photo;
                if (!src) return null;

                return (
                  <SwiperSlide key={index}>
                    <Image
                      unoptimized
                      src={src}
                      alt={post.title || "Listing Image"}
                      fill
                      className="object-cover"
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        ) : (
          <div className="h-44 mb-5 rounded-2xl bg-[var(--background)] flex items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] text-sm">
            No Image Available
          </div>
        )}

        {/* Details */}
        <div className="space-y-5">
          {post.location && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-sm font-medium">
              <IoLocationOutline className="text-[var(--primary-400)] dark:text-[var(--accent-400)]" size={20} />
              <span>
                {[post.location.state, post.location.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <div className="flex items-baseline gap-0.5 text-[var(--foreground)] font-bold">
              <span className="text-2xl tracking-tight">{post.price}</span>
              <span className="text-sm font-semibold text-[var(--foreground-muted)] ml-1">USD</span>
            </div>

            <Link
              href={`/posts/${post._id}`}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center justify-center"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}