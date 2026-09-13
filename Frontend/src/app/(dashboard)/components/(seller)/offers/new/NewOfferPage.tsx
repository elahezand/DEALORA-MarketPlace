"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineTag, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { HiArrowLeft, HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import Link from "next/link";
import { EntityAvatar } from "../../../shared/table/TableParts";
import { FormField, inputClass, textareaClass } from "../../../(admin)/shared/AdminFormModal";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useCreateOffer } from "@/services/Offer/useCreateOffer";
import { ListingProps, PublicListingsResponse } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { toast } from "sonner";

interface NewOfferPageProps {
  initialData?: InfiniteData<PublicListingsResponse>;
}

const LISTINGS_ENDPOINT = "/listings";

export default function NewOfferPage({ initialData }: NewOfferPageProps) {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<ListingProps | null>(null);

  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [shipsWithinDaysInput, setShipsWithinDaysInput] = useState("3");
  const [descriptionInput, setDescriptionInput] = useState("");

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
  } = useInfiniteGet<PublicListingsResponse>(
    LISTINGS_ENDPOINT,
    { q: isSearchMode ? debouncedSearch : undefined, listingType: "store_product", status: "active", limit: 8 },
    {
      queryKey: [LISTINGS_ENDPOINT, "offer-picker", isSearchMode ? debouncedSearch : "default"],
      initialData: !isSearchMode ? initialData : undefined,
      enabled: !selectedListing,
    }
  );

  const listings: ListingProps[] = (
    listingsData?.pages?.flatMap((page: PublicListingsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: createOffer, isPending } = useCreateOffer(() => {
    router.push("/dashboard/seller/offers");
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedListing) {
      toast.error("Pick a product to make an offer on");
      return;
    }

    const price = Number(priceInput);
    const stock = Number(stockInput);
    const discount = discountInput.trim() ? Number(discountInput) : undefined;
    const shipsWithinDays = shipsWithinDaysInput.trim() ? Number(shipsWithinDaysInput) : undefined;
    const description = descriptionInput.trim();

    if (!price || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (!stock || stock < 1 || !Number.isInteger(stock)) {
      toast.error("Stock must be a whole number of at least 1");
      return;
    }
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      toast.error("Discount must be between 0 and 100");
      return;
    }
    if (
      shipsWithinDays !== undefined &&
      (shipsWithinDays < 0 || shipsWithinDays > 60 || !Number.isInteger(shipsWithinDays))
    ) {
      toast.error("Ships within must be a whole number of days between 0 and 60");
      return;
    }
    if (description.length > 500) {
      toast.error("Note must be 500 characters or fewer");
      return;
    }

    createOffer({
      listingId: selectedListing._id,
      price,
      stock,
      discount,
      shipsWithinDays,
      description: description || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <Link
          href="/dashboard/seller/offers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-3"
        >
          <HiArrowLeft className="w-3.5 h-3.5" />
          Back to My Offers
        </Link>
        <p className="menu-section-title mb-1">Seller</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Add New Offer
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Pick a marketplace product and set your own price and stock to sell it through your store.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        {/* STEP 1 — Pick a listing */}
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
                    Listing price: ${selectedListing.price?.toLocaleString() ?? 0}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedListing(null);
                  setSearchInput("");
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors flex-shrink-0"
              >
                Change
              </button>
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
                      No matching products found
                    </p>
                  )}
                  {!(isSearchMode && isSearching) &&
                    listings.map((listing) => (
                      <button
                        key={listing._id}
                        type="button"
                        onClick={() => setSelectedListing(listing)}
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
                            ${listing.price?.toLocaleString() ?? 0}
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

        {/* STEP 2 — Offer details */}
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            2. Your offer
          </p>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Your Price">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="e.g. 250"
              />
            </FormField>
            <FormField label="Stock (your inventory)">
              <input
                type="number"
                min={1}
                step={1}
                className={inputClass}
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                placeholder="e.g. 10"
              />
            </FormField>
            <FormField label="Ships within (days)">
              <input
                type="number"
                min={0}
                max={60}
                step={1}
                className={inputClass}
                value={shipsWithinDaysInput}
                onChange={(e) => setShipsWithinDaysInput(e.target.value)}
                placeholder="e.g. 3"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Discount % (optional)">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className={inputClass}
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="e.g. 10"
              />
            </FormField>
            {priceInput && (
              <div className="flex flex-col justify-end pb-1">
                <p className="text-[11px] font-bold text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
                  Final price after discount
                </p>
                <p className="text-sm font-black text-[var(--foreground)]">
                  $
                  {(
                    Number(priceInput) -
                    (Number(priceInput) * (Number(discountInput) || 0)) / 100
                  ).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <FormField label="Note (optional)">
            <textarea
              className={textareaClass}
              rows={3}
              maxLength={500}
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder=""
            />
            <p className="text-[11px] text-[var(--foreground-subtle)] text-right mt-1">
              {descriptionInput.length}/500
            </p>
          </FormField>

          <p className="text-xs text-[var(--foreground-muted)]">
            Your offer will be reviewed by an admin before it appears live on the product page.
            If other sellers also offer this product, the lowest approved price is shown as the product&apos;s price — yours will still be listed as an available seller.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/seller/offers"
            className="text-xs font-bold px-4 h-10 flex items-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary !w-auto px-6 h-10 text-sm gap-2 flex items-center disabled:opacity-50"
          >
            <HiOutlineTag className="w-4 h-4" />
            {isPending ? "Submitting..." : "Submit Offer"}
          </button>
        </div>
      </form>
    </div>
  );
}