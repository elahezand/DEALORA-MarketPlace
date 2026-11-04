"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { EntityAvatar } from "../../../shared/table/TableParts";
import { inputClass } from "../../../admin/shared/AdminFormModal";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ListingProps } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { getListingPrice } from "@/utils/price";
import type { OfferableProductsResponse } from "./NewOfferPage";

const LISTINGS_ENDPOINT = "/offers/products";

interface OfferProductPickerProps {
  initialData?: InfiniteData<OfferableProductsResponse>;
  selectedListing: ListingProps | null;
  onPick: (listing: ListingProps | null) => void;
}

/* step 1 of a new offer: search the products of the store's category and pick one */
export default function OfferProductPicker({ initialData, selectedListing, onPick }: OfferProductPickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const isSearchMode = debouncedSearch.length > 1;

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSearching,
  } = useInfiniteGet<OfferableProductsResponse>(
    LISTINGS_ENDPOINT,
    { q: isSearchMode ? debouncedSearch : undefined, limit: 8 },
    {
      queryKey: [LISTINGS_ENDPOINT, "offer-picker", isSearchMode ? debouncedSearch : "default"],
      initialData: !isSearchMode ? initialData : undefined,
      enabled: !selectedListing,
    }
  );

  const listings: ListingProps[] = (
    listingsData?.pages?.flatMap((page: OfferableProductsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const needsCategory = listingsData?.pages?.[0]?.needsCategory === true;

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex flex-col gap-3">
      <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
        1. Choose a product
      </p>

      {selectedListing ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--primary-500)]/30 bg-[var(--primary-500)]/5 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <EntityAvatar
              src={getUrl(selectedListing.images?.[0])}
              alt={selectedListing.title}
              fallback={selectedListing.title.slice(0, 2).toUpperCase()}
              shape="square"
            />
            <div className="min-w-0">
              <p className="font-bold text-sm text-[var(--foreground)] truncate">
                {selectedListing.title}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Lowest current price: ${getListingPrice(selectedListing).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onPick(null);
              setSearchInput("");
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors flex-shrink-0"
          >
            Change
          </button>
        </div>
      ) : needsCategory ? (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 px-4 py-4 text-sm text-amber-700 dark:text-amber-300 flex flex-col gap-2">
          <p className="font-bold">Your store has no category yet</p>
          <p>You can only make offers on products in your store&apos;s category. Choose one first.</p>
          <Link href="/dashboard/seller/settings" className="font-bold underline w-fit">
            Set store category
          </Link>
        </div>
      ) : (
        <>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-[var(--foreground-subtle)] uppercase tracking-wider px-1">
              {isSearchMode ? "Search results" : "Suggested products"}
            </p>
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {isSearchMode && isSearching && (
                <p className="text-xs text-[var(--foreground-muted)] px-4 py-3">
                  Searching...
                </p>
              )}
              {!(isSearchMode && isSearching) && listings.length === 0 && (
                <p className="text-xs text-[var(--foreground-muted)] px-4 py-3">
                  {isSearchMode ? "No matching products in your store's category" : "No products in your store's category yet"}
                </p>
              )}
              {!(isSearchMode && isSearching) &&
                listings.map((listing) => (
                  <button
                    key={listing._id}
                    type="button"
                    onClick={() => onPick(listing)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--background-soft)] transition-colors text-left"
                  >
                    <EntityAvatar
                      src={getUrl(listing.images?.[0])}
                      alt={listing.title}
                      fallback={listing.title.slice(0, 2).toUpperCase()}
                      shape="square"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--foreground)] truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        From ${getListingPrice(listing).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="self-center flex items-center gap-1.5 text-xs font-bold text-[var(--primary-500)] hover:underline disabled:opacity-50 px-1 py-1"
              >
                <span>{isFetchingNextPage ? "Loading..." : "Load more products"}</span>
                <HiChevronRight
                  className={`text-sm transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
