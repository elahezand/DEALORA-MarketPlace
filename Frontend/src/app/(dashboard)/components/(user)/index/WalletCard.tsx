"use client";

import { HiOutlineWallet } from "react-icons/hi2";
import { useGetWallet } from "@/services/Wallet/useGetWallet";

export default function WalletCard() {
  const { data, isLoading } = useGetWallet();
  const balance = data?.pages?.[0]?.balance ?? 0;
  const transactions = data?.pages?.flatMap((page) => page.data ?? []) ?? [];
  const refunds = transactions.filter((tx) => tx.type === "refund");

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[var(--success-bg)] flex items-center justify-center flex-shrink-0">
          <HiOutlineWallet className="w-5 h-5 text-[var(--success-500)]" />
        </div>
        <div>
          <p className="text-xl font-black text-[var(--foreground)]">
            ${Number(balance).toLocaleString()}
          </p>
          <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
            Wallet balance
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-xs font-black text-[var(--foreground)]">Refund history</p>
        {isLoading ? (
          <p className="text-xs text-[var(--foreground-muted)]">Loading...</p>
        ) : refunds.length === 0 ? (
          <p className="text-xs text-[var(--foreground-muted)]">No refunds yet.</p>
        ) : (
          <div className="space-y-2">
            {refunds.slice(0, 5).map((tx) => (
              <div key={tx._id} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-[var(--foreground)]">
                    Refund {tx.order?._id ? `#${tx.order._id.slice(-8).toUpperCase()}` : ""}
                  </p>
                  <p className="text-[var(--foreground-muted)]">
                    {new Date(tx.createdAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                <span className="font-black text-[var(--success-500)]">
                  +${Number(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
