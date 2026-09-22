import type { ListingVariant } from "./Listings";

export type OfferStatus = "pending" | "accepted" | "rejected";
export interface  Offer {
    _id: string;
  variantId: string;
  price: number;
  discount: number;
  finalPrice: number;
  stock: number;
  shipsWithinDays?: number;
  description?: string | null;
  status: OfferStatus;
  adminComment?: string | null;
  createdAt: string;
  productId?: { _id: string; title?: string; images?: string[]; variants?: ListingVariant[] } | string;
  store?: {
    _id: string;
    name?: string;
    meta?: { ratings?: number; reviewsCount?: number };
    owner?: { _id: string; name?: string; username?: string; phone?: string } | string;
  } | string;
}

export interface OffersResponse {
  success: boolean;
  data: Offer[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}