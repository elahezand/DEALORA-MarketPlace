"use client";

import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { IOrder } from "@/types/Order";
import {
  formatDateTime, formatDay, formatTime, getDeliveryInfo, getExpectedDelivery, getShippedAt,
} from "@/utils/orderDates";

/*
   read-only parts of the buyer's order page (OrderDetail).
   they only render the order — cancelling / confirming stays in the parent.
*/

/* expected arrival — the day and time the shipper gave, as clear as possible */
export function ExpectedArrival({ order, now }: { order: IOrder; now: number }) {
  const expected = getExpectedDelivery(order);
  const active = order.status === "shipped" || (order.status === "processing" && !!expected);
  if (!expected || !active) return null;
  const late = expected.getTime() < now;
  const weekday = expected.toLocaleDateString("en-US", { weekday: "long" });
  return (
    <div
      className={`card rounded-2xl border p-5 flex items-center gap-4 ${late
        ? "border-[var(--warning-500)]/40 bg-[var(--warning-bg)]"
        : "border-[var(--primary-500)]/25 bg-[var(--primary-500)]/5"}`}
    >
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${late
        ? "bg-[var(--warning-500)]/15 text-[var(--warning-500)]"
        : "bg-[var(--primary-500)]/10 text-[var(--primary-500)]"}`}>
        <HiOutlineTruck className="w-6 h-6" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
          {late ? "Was expected" : order.status === "shipped" ? "Arriving" : "First items arriving"}
        </p>
        <p className="text-lg font-black text-[var(--foreground)] leading-tight">
          {weekday}, {formatDay(expected)}
          <span className="font-semibold text-[var(--foreground-muted)]"> · around </span>
          <span className="font-mono">{formatTime(expected)}</span>
        </p>
        {late && (
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            It&apos;s running late. If it doesn&apos;t arrive soon,{" "}
            <Link href="/contact-us" className="font-bold text-[var(--primary-500)] hover:underline">contact support</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

/* delivery timeline — placed → shipped → delivered, each with date and time */
export function DeliveryTimeline({ order }: { order: IOrder }) {
  const buyerConfirmed = !!order.buyerConfirmedAt;
  const delivery = getDeliveryInfo(order);
  const shippedAt = getShippedAt(order);
  const isCancelled = order.status === "cancelled";
  const isDone = order.status === "completed";

  const steps = [
    { key: "placed", label: "Order placed", icon: HiOutlineClock, date: order.createdAt, done: true },
    {
      key: "shipped",
      label: "Shipped",
      icon: HiOutlineTruck,
      date: shippedAt,
      done: !!shippedAt && (order.status === "shipped" || isDone),
      hint: !shippedAt && !isCancelled && delivery.date ? `${delivery.label} ${formatDay(delivery.date)}` : undefined,
    },
    isCancelled
      ? { key: "cancelled", label: "Cancelled", icon: HiOutlineXCircle, date: null, done: true, cancelled: true }
      : {
          key: "delivered",
          label: isDone ? delivery.label : "Delivered",
          icon: HiOutlineCheckCircle,
          date: isDone ? delivery.date : null,
          done: isDone,
          hint: isDone
            ? delivery.note
            : order.status === "shipped" && buyerConfirmed
              ? `You confirmed receipt ${formatDateTime(order.buyerConfirmedAt)}`
            : order.status === "shipped"
              ? getExpectedDelivery(order)
                ? `Expected ${formatDateTime(getExpectedDelivery(order))}`
                : "Waiting for your confirmation"
              : undefined,
        },
  ];

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-5">
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const tone = "cancelled" in step && step.cancelled
            ? "text-[var(--destructive)] bg-[var(--destructive-bg)]"
            : step.done
              ? "text-[var(--success-500)] bg-[var(--success-bg)]"
              : "text-[var(--foreground-subtle)] bg-[var(--background-soft)]";
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${step.done ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>
                  {step.label}
                </p>
                {step.date && step.done ? (
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {formatDay(step.date)}
                    <span className="mx-1 opacity-50">·</span>
                    <span className="font-mono">{formatTime(step.date)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-[var(--foreground-subtle)]">{"hint" in step && step.hint ? step.hint : "—"}</p>
                )}
                {step.done && "hint" in step && step.hint && step.date && (
                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">{step.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* payment summary + shipping address */
export function OrderSummary({ order }: { order: IOrder }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pricing */}
      <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineCreditCard className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">Payment</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--foreground-muted)]">Subtotal</span>
          <span className="text-[var(--foreground)] font-semibold">
            ${order.pricing?.subtotal?.toLocaleString() ?? 0}
          </span>
        </div>
        {(order.pricing?.discount ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--foreground-muted)]">Discount</span>
            <span className="text-[var(--success-500)] font-semibold">
              -${order.pricing.discount.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--foreground-muted)]">Shipping</span>
          <span className="text-[var(--foreground)] font-semibold">
            ${order.pricing?.shippingCost?.toLocaleString() ?? 0}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-[var(--border)] mt-1">
          <span className="text-[var(--foreground)] font-bold">Total</span>
          <span className="text-[var(--foreground)] font-black">
            ${order.pricing?.total?.toLocaleString() ?? 0}
          </span>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mt-2">
          Method: {order.paymentMethod} · Placed {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Shipping address */}
      <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineMapPin className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">Shipping Address</span>
        </div>
        {order.shippingAddress ? (
          <div className="text-sm text-[var(--foreground)] leading-relaxed">
            <p className="font-semibold">{order.shippingAddress.name}</p>
            <p className="text-[var(--foreground-muted)]">{order.shippingAddress.address}</p>
            <p className="text-[var(--foreground-muted)]">
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            <p className="text-[var(--foreground-muted)]">{order.shippingAddress.postalCode}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">No address on file</p>
        )}
      </div>
    </div>
  );
}
