"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import {
  formatDateTime, formatDay, formatTime, getDeliveryInfo, getExpectedDelivery, getShippedAt,
  groupOrderItems, partStatus, PartStatus,
} from "@/utils/orderDates";
import { useConfirmDelivery } from "@/services/Order/useConfirmDelivery";
import { useCancelOrder } from "@/services/Order/useCancelOrder";
import { useCancelOrderItem } from "@/services/Order/useCancelOrderItem";
import { Badge } from "../../shared/table/TableParts";
import { IOrder, OrderStatus, PaymentStatus } from "@/types/Order";
import { toast } from "sonner";
import { getOrderItemVariantLabel } from "@/utils/orderItem";

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "destructive" | "neutral" | "info"> = {
  created: "neutral",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
};

const PAYMENT_TONE: Record<PaymentStatus, "success" | "warning" | "destructive" | "neutral"> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "neutral",
};

const NON_CANCELLABLE: OrderStatus[] = ["shipped", "completed", "cancelled"];

const PART_BADGE: Record<PartStatus, { tone: "success" | "warning" | "destructive" | "info"; label: string }> = {
  preparing: { tone: "warning", label: "Preparing" },
  shipped: { tone: "info", label: "On its way" },
  delivered: { tone: "success", label: "Delivered" },
  cancelled: { tone: "destructive", label: "Cancelled" },
};

interface OrderDetailProps {
  initialOrder: IOrder | null;
  orderId: string;
}

export default function OrderDetail({ initialOrder, orderId }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<IOrder | null>(initialOrder);

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const { mutate: confirmDelivery, isPending: isConfirming } = useConfirmDelivery();
  const { mutate: cancelItem, isPending: isCancellingItem } = useCancelOrderItem();

  const handleCancel = () => {
      toast.warning("Are you sure you want to delete this Order?", {
    description: "This action cannot be undone.",
    action: {
      label: "Delete",
      onClick: () => cancelOrder(
        { id: orderId },
        {
          onSuccess: (res) => {
            if (res?.data) setOrder(res.data);
            router.refresh();
          },
        }
      ),
    },
    cancel: {
      label: "Cancel",
      onClick: () => {},
    },
  });

  };

  const handleCancelItem = (itemId: string, title: string) => {
    toast.warning(`Cancel "${title}"?`, {
      description: "The rest of your order goes on. This can't be undone.",
      action: {
        label: "Cancel item",
        onClick: () =>
          cancelItem(
            { id: orderId, itemId },
            {
              onSuccess: (res) => {
                if (res?.data) setOrder(res.data);
                router.refresh();
              },
            }
          ),
      },
      cancel: {
        label: "Keep it",
        onClick: () => {},
      },
    });
  };

  // group = one store's package (store id, or "site")
  const handleConfirmDelivery = (group: string) => {
    if (!order) return;
    toast.warning("Confirm you've received this package?", {
      description:
        order.paymentMethod === "cash"
          ? "It's completed once the seller confirms your cash payment. This can't be undone."
          : "This can't be undone.",
      action: {
        label: "Confirm",
        onClick: () =>
          confirmDelivery(
            { id: orderId, group },
            {
              onSuccess: (res) => {
                if (res?.data) setOrder(res.data);
                router.refresh();
              },
            }
          ),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-[var(--foreground)] font-bold">Order not found</p>
        <p className="text-sm text-[var(--foreground-muted)]">
          This order doesn&apos;t exist or doesn&apos;t belong to your account.
        </p>
        <Link href="/dashboard/orders" className="btn-primary !w-auto px-5 h-10 text-sm mt-2">
          Back to Orders
        </Link>
      </div>
    );
  }

  // once any item has left, the buyer can't cancel on their own (same rule as the backend) —
  // the order stays "processing" until EVERY item is shipped, so the status alone isn't enough
  const hasShippedItems = !!order.items?.some((item) => item.fulfillment?.status === "shipped");
  const canCancel = !NON_CANCELLABLE.includes(order.status) && !hasShippedItems;

  // the buyer already confirmed every package
  const buyerConfirmed = !!order.buyerConfirmedAt;

  // one box per store — each is shipped, received and paid out on its own
  const parts = groupOrderItems(order.items ?? []);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col gap-6 pb-10 mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link aria-label="Back to my orders"
            href="/dashboard/orders"
            className="p-2 rounded-lg hover:bg-[var(--background-soft)] transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
          </Link>
          <div>
            <p className="menu-section-title mb-1">Order</p>
            <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight font-mono">
              #{order._id.slice(-8).toUpperCase()}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[order.status] ?? "neutral"} label={order.status} />
          <Badge tone={PAYMENT_TONE[order.paymentStatus] ?? "neutral"} label={order.paymentStatus} />
        </div>
      </div>

      {/* Expected arrival — the day and time the shipper gave, as clear as possible */}
      {(() => {
        const expected = getExpectedDelivery(order);
        const active = order.status === "shipped" || (order.status === "processing" && !!expected);
        if (!expected || !active) return null;
        const late = expected.getTime() < Date.now();
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
      })()}

      {/* Delivery timeline — placed → shipped → delivered, each with date and time */}
      {(() => {
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
      })()}

      {/* Items — one package per store */}
      {parts.map(({ key, items }) => {
        const status = partStatus(items);
        const badge = PART_BADGE[status];
        const active = items.filter((item) => !item.cancelledAt);
        const storeName = items[0]?.storeSnapshot?.name || "Dealora";
        const confirmed = active.length > 0 && active.every((item) => item.buyerConfirmedAt);
        const canConfirm = status === "shipped" && !confirmed;
        const waitingForCash =
          status === "shipped" && confirmed && order.paymentMethod === "cash" && active.some((item) => !item.cashCollectedAt);
        const deliveredAt = active.find((item) => item.deliveredAt)?.deliveredAt;

        return (
          <div key={key} className="card rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <HiOutlineShoppingBag className="w-5 h-5 text-[var(--foreground-muted)] shrink-0" />
                <span className="font-bold text-[var(--foreground)] text-sm truncate">
                  {parts.length > 1 ? `Package from ${storeName}` : `Items (${items.length})`}
                </span>
                <Badge tone={badge.tone} label={badge.label} />
                {status === "delivered" && deliveredAt && (
                  <span className="text-[11px] text-[var(--foreground-muted)]">{formatDateTime(deliveredAt)}</span>
                )}
              </div>
              {canConfirm && (
                <button
                  onClick={() => handleConfirmDelivery(key)}
                  disabled={isConfirming}
                  className="btn-primary !w-auto px-4 h-9 text-xs disabled:opacity-50"
                >
                  {isConfirming ? "Confirming..." : "I've received it"}
                </button>
              )}
              {waitingForCash && (
                <span className="text-[11px] text-[var(--foreground-muted)]">
                  Received — waiting for the seller to confirm your cash payment
                </span>
              )}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {items.map((item, idx) => {
                const isShipped = item.fulfillment?.status === "shipped";
                const isCancelled = !!item.cancelledAt;
                const isDelayed =
                  !isShipped && !isCancelled &&
                  !!item.estimatedShipBy &&
                  new Date(item.estimatedShipBy) < new Date();
                return (
                  <div key={idx} className={`flex items-center justify-between px-5 py-4 gap-3 ${isCancelled ? "opacity-60" : ""}`}>
                    <div className="min-w-0">
                      <Link
                        href={`/posts/${item.productId}`}
                        className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary-500)] transition-colors"
                      >
                        {item.productSnapshot.title}
                      </Link>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        Qty: {item.quantity}
                        {getOrderItemVariantLabel(item) && ` · ${getOrderItemVariantLabel(item)}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {isCancelled ? (
                          <Badge tone="destructive" label="Cancelled" />
                        ) : (
                          <Badge
                            tone={item.deliveredAt ? "success" : isShipped ? "info" : isDelayed ? "destructive" : "warning"}
                            label={item.deliveredAt ? "Delivered" : isShipped ? "Shipped" : isDelayed ? "Delayed" : "Preparing"}
                          />
                        )}
                        {isShipped && !isCancelled && item.fulfillment?.shippedAt && (
                          <span className="text-[11px] text-[var(--foreground-muted)]">
                            on {formatDate(item.fulfillment.shippedAt)}
                          </span>
                        )}
                        {isShipped && item.fulfillment?.trackingCode && (
                          <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
                            · Tracking: {item.fulfillment.trackingCode}
                          </span>
                        )}
                        {isShipped && !item.deliveredAt && !isCancelled && item.fulfillment?.estimatedDeliveryAt && (
                          <span className="text-[11px] font-semibold text-[var(--primary-500)]">
                            · Arrives {formatDateTime(item.fulfillment.estimatedDeliveryAt)}
                          </span>
                        )}
                        {order.paymentMethod === "cash" && !isCancelled && (
                          <span className={`text-[11px] font-semibold ${item.cashCollectedAt
                            ? "text-[var(--success-500)]"
                            : "text-[var(--warning-500)]"}`}>
                            · 💵 {item.cashCollectedAt
                              ? "Paid"
                              : `Pay ${item.storeSnapshot?.name || "the courier"} in cash on delivery`}
                          </span>
                        )}
                        {!isShipped && !isCancelled && item.estimatedShipBy && (
                          <span className="text-[11px] text-[var(--foreground-muted)]">
                            {isDelayed ? "Was expected by" : "Estimated ship by"} {formatDate(item.estimatedShipBy)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className={`text-sm font-black text-[var(--foreground)] ${isCancelled ? "line-through" : ""}`}>
                        ${(item.finalPrice * item.quantity).toLocaleString()}
                      </p>
                      {/* not shipped yet → the buyer can drop just this item */}
                      {order.status === "processing" && !isShipped && !isCancelled && item._id && (
                        <button
                          onClick={() => handleCancelItem(item._id!, item.productSnapshot.title)}
                          disabled={isCancellingItem}
                          className="text-[11px] font-semibold text-[var(--destructive)] hover:underline disabled:opacity-50"
                        >
                          Cancel item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(order.refundAmount ?? 0) > 0 && order.status !== "cancelled" && (
        <p className="text-xs text-[var(--foreground-muted)]">
          ${order.refundAmount?.toLocaleString()} was refunded to your wallet for the cancelled items.
        </p>
      )}

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

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-5 h-10 rounded-lg text-sm font-bold border border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50"
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>
      {(order.status === "shipped" || (hasShippedItems && order.status === "processing")) && (
        <p className="text-xs text-[var(--foreground-muted)] text-right">
          Already shipped, so it can&apos;t be cancelled here. Didn&apos;t arrive or something&apos;s wrong?{" "}
          <Link href="/contact-us" className="font-bold text-[var(--primary-500)] hover:underline">
            Contact support
          </Link>
        </p>
      )}
    </div>
  );
}