export type OfferStatus = "pending" | "accepted" | "rejected";

export interface OffersResponse {
  data: Offer[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}
  _id: string;
  price: number;
  discount?: number;
  finalPrice?: number;
  condition?: "new" | "used";
  stock: number;
  status: OfferStatus;
  adminComment?: string | null;
  createdAt: string;
  seller?: { _id: string; username?: string; phone?: string } | string;
  product?: { _id: string; title?: string; images?: string[] } | string;
  listing?: { _id: string; title?: string; images?: string[] } | string;
  store?: { _id: string; name?: string } | string;
}
