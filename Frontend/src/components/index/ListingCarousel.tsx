"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import ListingsSection from "@/components/shared/listingSection";
import { ListingProps } from "@/types/Listings";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ListingsCarouselProps {
  listings: ListingProps[];
}

export default function ListingsCarousel({ listings }: ListingsCarouselProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--foreground-muted)]">
        No listings found in this category.
      </div>
    );
  }

  return (
    <div className="w-full relative custom-swiper-container">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true, dynamicBullets: true }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        className="pb-12" 
      >
        {listings.map((item) => (
          <SwiperSlide key={item._id}>
            <ListingsSection listings={[item]} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}