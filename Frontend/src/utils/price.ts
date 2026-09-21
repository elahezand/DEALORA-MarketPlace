import type { ListingProps, ListingVariant } from "@/types/Listings";

type PricedListing = Pick<ListingProps, "listingType" | "price" | "minPrice">;

export const getVariantFinalPrice = (variant?: Pick<ListingVariant, "finalPrice"> | null): number =>
  variant?.finalPrice ?? 0;

export const getListingPrice = (listing?: Partial<PricedListing> | null): number => {
  if (!listing) return 0;
  return (listing.listingType === "user_ad" ? listing.price : listing.minPrice) ?? 0;
};

/** Human label of a variant, e.g. "Black - 128GB". */
export const getVariantLabel = (
  variant?: Partial<Pick<ListingVariant, "attributes" | "sku">> | null
): string => {
  if (!variant) return "";
  const values = variant.attributes ? Object.values(variant.attributes).filter(Boolean) : [];
  return values.length ? values.join(" - ") : variant.sku || "";
};

/** Finds a variant of a listing by id (listing may be populated or a plain id). */
export const findVariant = (
  listing: { variants?: ListingVariant[] } | string | null | undefined,
  variantId?: string | null
): ListingVariant | undefined => {
  if (!listing || typeof listing === "string" || !variantId) return undefined;
  return listing.variants?.find((v) => v._id === variantId);
};