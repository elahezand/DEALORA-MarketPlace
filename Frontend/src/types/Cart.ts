export interface CartItem {
  offer?: { _id: string; price?: number; discount?: number; stock?: number; store?: { _id: string; name?: string } | string; finalPrice?: number; condition?: "new" | "used" } | string | null;
  store?: string | null;
  product: { _id: string; title?: string; images?: string[] } | string;
  variantId?: string | null;
  variantSnapshot?: {
    attributes?: Record<string, string> | null;
    sku?: string | null;
  };
  quantity: number;
  priceSnapshot: number;
}

export interface CartCoupon {
  couponRef?: string | null;
  code?: string;
  discountType?: "fixed" | "percent";
  discountValue?: number;
  maxDiscount?: number;
}

export interface CartPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export interface ICart {
  _id: string;
  user: string;
  items: CartItem[];
  coupon: CartCoupon | null;
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
  success?: boolean;
  message?: string;
  paymentUrl?: string;
  order?: { _id: string };
}
