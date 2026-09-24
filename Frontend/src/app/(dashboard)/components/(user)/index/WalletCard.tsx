"use client";

import { HiOutlineWallet } from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/useGetProfile";

/** Money refunded from cancelled orders */
export default function WalletCard() {
  const { user, isLoading } = useGetProfile();
  const balance = user?.wallet?.balance ?? 0;

  if (isLoading || balance <= 0) return null;

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-[var(--success-bg)] flex items-center justify-center flex-shrink-0">
        <HiOutlineWallet className="w-5 h-5 text-[var(--success-500)]" />
      </div>
      <div>
        <p className="text-xl font-black text-[var(--foreground)]">${balance.toLocaleString()}</p>
        <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
          Wallet balance (refunds)
        </p>
      </div>
    </div>
  );
}
