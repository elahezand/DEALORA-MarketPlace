
export interface Coupon {
  _id: string;
  code: string;
  type: "fixed" | "percent";
  amount: number;
  maxDiscount?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount?: number;
  createdAt: string;
}


export  interface FormState {
  _id?: string;
  code: string;
  type: "fixed" | "percent";
  amount: string;
  maxDiscount: string;
  isActive: boolean;
  expiresAt: string;
  usageLimit: string;
}
