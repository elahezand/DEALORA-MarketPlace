
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
  price: number;
  discount: number;
  finalPrice: number;
}

export interface CartPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export interface ICart {
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