import { IPagination } from "./common";

export type WalletTransactionType = "spend" | "refund";

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: WalletTransactionType;
  note?: string;
  createdAt: string;
  order?: {
    _id: string;
    status: string;
    paymentStatus: string;
    pricing?: { total: number; walletUsed?: number };
    createdAt: string;
  } | null;
}

/** GET /users/me/wallet */
export interface WalletResponse {
  success: boolean;
  balance: number;
  totals: { refunded: number; spent: number };
  data: WalletTransaction[];
  pagination?: IPagination;
}
