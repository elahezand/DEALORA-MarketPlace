export type OrderStatus = "created" | "processing" | "shipped" | "completed" | "cancelled"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash" | "zarinpal";

export interface IOrderItem {
  product: string;
  variant: string;
  quantity: number;
  price: number;
  seller?: string;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ICoupon {
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  maxDiscount?: number;
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
  data: {
    data: IOrder[];
    pagination?: {
      hasMore: boolean;
      limit: number;
      nextCursor: string | null;
    };
  }
}

export interface AdminOrdersResponse {
  success: boolean;
  data: {
    data: IOrder[];
    pagination?: {
      hasMore: boolean;
      limit: number;
      nextCursor: string | null;
    };
  };
}