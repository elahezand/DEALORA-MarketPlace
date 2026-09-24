/**
 * One cart item as returned by GET /cart/me.
 * The backend stores only product / variantId / offer / quantity; everything else
 * (prices, store, variant name) is calculated with the CURRENT prices on every read.
 */
export interface CartItem {
  offer?: { _id: string; price?: number; discount?: number; stock?: number; shipsWithinDays?: number; store?: { _id: string; name?: string } | string; finalPrice?: number } | string | null;
  store?: string | null;
  productId: { _id: string; title?: string; images?: string[] } | string;
  variantId?: string | null;
  variantSnapshot?: {
    attributes?: Record<string, string> | null;
    sku?: string | null;
  };
  quantity: number;
  /** unit price before discount (server snapshot) */
  price: number;
  /** percent 0-100 */
  discount: number;
  /** unit price the user pays */
  finalPrice: number;
}

export interface CartPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export interface ICart {
  /** the API returns "id" (see the model's toJSON transform) */
  id?: string;
  _id?: string;
  user: string;
  items: CartItem[];
  coupon: { _id: string; code: string } | null;
  shippingCost?: number;
  removedItems?: { reason: string; offerId?: string; productId?: string }[];
  pricing: CartPricing;
  status: "active" | "abandoned" | "converted";
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: ICart;
}

export interface CheckoutResponse {
  success: boolean;
  data: {
    order: { _id: string, paymentMethod: string };
    paymentUrl: string | null;
    paymentMethod: string | null;
  };
}