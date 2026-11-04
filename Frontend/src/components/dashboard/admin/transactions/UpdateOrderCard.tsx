"use client";

import { OrderStatus, PaymentStatus } from "@/types/Order";

interface UpdateOrderCardProps {
  orderStatus: OrderStatus;
  status: OrderStatus;
  setStatus: (status: OrderStatus) => void;
  paymentStatus: PaymentStatus;
  setPaymentStatus: (status: PaymentStatus) => void;
  statusOptions: OrderStatus[];
  paymentOptions: PaymentStatus[];
  isLocked: boolean;
  hasChanges: boolean;
  isPending: boolean;
  onSave: () => void;
}

/* the admin's manual status / payment status change for one order */
export default function UpdateOrderCard({
  orderStatus,
  status,
  setStatus,
  paymentStatus,
  setPaymentStatus,
  statusOptions,
  paymentOptions,
  isLocked,
  hasChanges,
  isPending,
  onSave: saveChanges,
}: UpdateOrderCardProps) {
  return (
    <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
      <span className="font-bold text-[var(--foreground)] text-sm">
        Update Order
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[var(--foreground-muted)]">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {orderStatus === "shipped" && (
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Set automatically once every item was shipped.
            </p>
          )}
          {isLocked && (
            <p className="text-[11px] text-[var(--foreground-muted)]">
              This order is final — its status can no longer be changed by hand.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[var(--foreground-muted)]">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatus)
            }
            className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
          >
            {paymentOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!hasChanges || isPending || isLocked}
          onClick={saveChanges}
          className="btn-primary !w-auto px-5 h-10 text-sm disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
