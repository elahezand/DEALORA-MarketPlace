"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineTag } from "react-icons/hi2";
import { HiArrowLeft } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import Link from "next/link";
import { FormField, inputClass, textareaClass } from "../../../admin/shared/AdminFormModal";
import { useCreateOffer } from "@/services/Offer/useCreateOffer";
import { ListingProps, ListingVariant, PublicListingsResponse } from "@/types/Listings";
import { getVariantLabel } from "@/utils/price";
import { toast } from "sonner";
import OfferProductPicker from "./OfferProductPicker";
import OfferVariantPicker from "./OfferVariantPicker";

/** GET /offers/products — only active products in the seller's store category */
export interface OfferableProductsResponse extends PublicListingsResponse {
  needsCategory?: boolean;
}

interface NewOfferPageProps {
  initialData?: InfiniteData<OfferableProductsResponse>;
}

export default function NewOfferPage({ initialData }: NewOfferPageProps) {
  const router = useRouter();

  const [selectedListing, setSelectedListing] = useState<ListingProps | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  const pickListing = (listing: ListingProps | null) => {
    setSelectedListing(listing);
    setSelectedVariantId(listing?.variants?.length === 1 ? listing.variants[0]._id : "");
  };

  const selectedVariant = selectedListing?.variants?.find((v: ListingVariant) => v._id === selectedVariantId) || null;

  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [shipsWithinDaysInput, setShipsWithinDaysInput] = useState("3");
  const [descriptionInput, setDescriptionInput] = useState("");

  const { mutate: createOffer, isPending } = useCreateOffer(() => {
    router.replace("/dashboard/seller/offers");
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedListing) {
      toast.error("Pick a product to make an offer on");
      return;
    }
    if (!selectedVariantId) {
      toast.error("Pick which variant you are selling");
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
      productId: selectedListing._id,
      variantId: selectedVariantId,
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
        <OfferProductPicker initialData={initialData} selectedListing={selectedListing} onPick={pickListing} />

        {/* STEP 2 — Pick a variant */}
        {selectedListing && (
          <OfferVariantPicker
            listing={selectedListing}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
          />
        )}

        {/* STEP 3 — Offer details */}
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            3. Your offer{selectedVariant ? ` — ${getVariantLabel(selectedVariant)}` : ""}
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
            Each offer is for one variant — to sell another variant (e.g. 256GB), submit a separate offer for it.
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