export type OfferStatus = "pending" | "accepted" | "rejected";

export interface Offer {
  _id: string;
  price: number;
  stock: number;
  status: OfferStatus;
  adminComment?: string | null;
  createdAt: string;
  seller?: { _id: string; username?: string; phone?: string } | string;
  product?: { _id: string; title?: string; images?: string[] } | string;
  store?: { _id: string; name?: string } | string;
}
