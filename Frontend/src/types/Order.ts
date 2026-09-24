export type OrderStatus = "created" | "processing" | "shipped" | "completed" | "cancelled"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash" | "zarinpal";

export interface IOrderFulfillment {
  status: "pending" | "shipped";
  trackingCode: string | null;
  shippedAt: string | Date | null;
}

export interface IOrderProductSnapshot {
  title: string;
  image: string | null;
  slug: string | null;
}

export interface IOrderVariantSnapshot {
  attributes: Record<string, string> | null;
  sku: string | null;
}

export interface IOrderItem {
  productId: string;
  variantId: string | null;
  offer?: string | null;
  store?: string | null;
  quantity: number;
  price: number;
  discount: number;
  finalPrice: number;
  productSnapshot: IOrderProductSnapshot;
  variantSnapshot: IOrderVariantSnapshot;
  storeSnapshot: { name: string | null };
  fulfillment?: IOrderFulfillment;
  estimatedShipBy?: string | Date | null;
  needsAdminShipment?: boolean;
}

export interface ICoupon {
  couponId: string;
  code: string;
  type: "fixed" | "percent";
  amount: number;
  maxDiscount?: number | null;
}

export interface IPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export interface IShippingAddress {
  name: string;
  postalCode: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  state: string;
  city: string;
}

export interface IPayment {
  authority: string | null;
  refId: string | null;
  paidAt: string | Date | null;
}

export interface IOrder {
  _id: string;
  user: string;
  items: IOrderItem[];
  coupon: ICoupon | null;
  pricing: IPricing;
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payment: IPayment;
  status: OrderStatus;
  isDelivered: boolean;
  deliveredAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrdersResponse {
    success: boolean;
    data: IOrder[];
    pagination?: {
      hasMore: boolean;
      limit: number;
      nextCursor: string | null;
    };

}

export interface AdminOrdersResponse {
  success: boolean;
  data: (IOrder & { hasPendingAdminItems?: boolean })[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}

/* ADMIN — GET /orders/admin/:id is populated for the order detail page:
   product, seller (Store), and buyer info are all real objects, not just
   ids. */
export interface IAdminOrderItem extends Omit<IOrderItem, "productId" | "store"> {
  _id: string;
  productId: { _id: string; title?: string; images?: string[] } | string;
  store: { _id: string; name?: string; slug?: string } | string | null;
}

export interface IAdminOrder extends Omit<IOrder, "items" | "user"> {
  items: IAdminOrderItem[];
  user: { _id: string; username?: string; phone?: string } | string;
}

export interface AdminOrderResponse {
  success: boolean;
  data: IAdminOrder;
}

/* SELLER —*/
export interface ISellerOrderItem {
  _id: string;
  productId: { _id: string; title?: string; images?: string[] } | string;
  variantId: string | null;
  quantity: number;
  price: number;
  discount: number;
  finalPrice: number;
  store?: string | null;
  productSnapshot: IOrderProductSnapshot;
  variantSnapshot: IOrderVariantSnapshot;
  fulfillment?: IOrderFulfillment;
  estimatedShipBy?: string | Date | null;
}

export interface ISellerOrder extends Omit<IOrder, "items" | "user"> {
  items: ISellerOrderItem[];
  user: { _id: string; username?: string; phone?: string } | string;
  mySubtotal: number;
  myFulfillmentStatus: "pending" | "partial" | "shipped";
}

export interface SellerOrdersResponse {
  success: boolean;
  data: ISellerOrder[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}