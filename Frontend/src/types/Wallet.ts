export interface WalletOrder {
  _id: string;
  status?: string;
  paymentStatus?: string;
  refundAmount?: number;
  refundedAt?: string | null;
  createdAt?: string;
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: "spend" | "refund";
  note?: string;
  createdAt: string;
  order?: WalletOrder | null;
}

export interface WalletResponse {
  success: boolean;
  balance: number;
  data: WalletTransaction[];
  pagination?: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}
