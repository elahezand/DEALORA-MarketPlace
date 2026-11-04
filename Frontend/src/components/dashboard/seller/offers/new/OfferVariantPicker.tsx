"use client";

import { ListingProps, ListingVariant } from "@/types/Listings";
import { getVariantFinalPrice, getVariantLabel } from "@/utils/price";

interface OfferVariantPickerProps {
  listing: ListingProps;
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

/* step 2 of a new offer: which variant of the product the store sells */
export default function OfferVariantPicker({ listing: selectedListing, selectedVariantId, onSelect }: OfferVariantPickerProps) {
  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-5 flex flex-col gap-3">
      <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
        2. Choose a variant
      </p>
      {(selectedListing.variants?.length ?? 0) === 0 ? (
        <p className="text-xs text-[var(--foreground-muted)]">This product has no variants yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedListing.variants!.map((v: ListingVariant) => {
            const isSelected = v._id === selectedVariantId;
            return (
              <button
                key={v._id}
                type="button"
                onClick={() => onSelect(v._id)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 text-left ${isSelected
                  ? "border-[var(--primary-500)] bg-[var(--primary-500)]/10 text-[var(--primary-600)]"
                  : "border-[var(--border)] hover:bg-[var(--background-soft)] text-[var(--foreground)]"
                  }`}
              >
                <span className="block">{getVariantLabel(v) || "Default"}</span>
                <span className="block text-[11px] font-medium text-[var(--foreground-muted)]">
                  Site price: ${getVariantFinalPrice(v).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
