import type { ListingProps } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { getListingPrice } from "@/utils/price";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Dealora";

/* meta descriptions are cut by search engines around 155 chars */
export const toMetaDescription = (text?: string | null, max = 155): string => {
  const clean = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

/* JSON-LD inside <script>: "<" is escaped so a "</script>" in the data can't close the tag */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");

/* schema.org Product for a listing page (Google shows price & availability from it) */
export const buildListingJsonLd = (listing: ListingProps) => {
  const price = getListingPrice(listing);
  const image = (listing.images ?? []).map((img) => getUrl(img)).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: toMetaDescription(listing.description, 500),
    ...(image.length ? { image } : {}),
    ...(listing.shortIdentifier ? { sku: listing.shortIdentifier } : {}),
    url: `${SITE_URL}/posts/${listing._id}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price,
      itemCondition:
        listing.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
    },
  };
};
