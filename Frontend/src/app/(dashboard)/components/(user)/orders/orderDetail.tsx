"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineCreditCard,
} from "react-icons/hi2";
import { useCancelOrder } from "@/services/Order/useCancelOrder";
import { useConfirmDelivery } from "@/services/Order/useConfirmDelivery";
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

/** How many days after the last item ships before we assume the order */
const DELIVERY_WINDOW_DAYS = 3;

interface OrderDetailProps {
  initialOrder: IOrder | null;
  orderId: string;
}

export default function OrderDetail({ initialOrder, orderId }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<IOrder | null>(initialOrder);

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const { mutate: confirmDelivery, isPending: isConfirming } = useConfirmDelivery();

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

  const handleConfirmDelivery = () => {
    toast.warning("Confirm you've received this order?", {
      description: "This closes the order and can't be undone.",
      action: {
        label: "Confirm",
        onClick: () =>
          confirmDelivery(
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

  const canCancel = !NON_CANCELLABLE.includes(order.status);

  const lastShippedAt = order.items
    ?.map((item) => item.fulfillment?.shippedAt)
    .filter((d): d is string | Date => !!d)
    .map((d) => new Date(d).getTime())
    .reduce((max, t) => Math.max(max, t), 0);

  const pastDeliveryWindow =
    order.status === "shipped" &&
    !!lastShippedAt &&
    Date.now() - lastShippedAt >= DELIVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

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
          <Link
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

      {/* Confirm-receipt reminder — only once it's plausibly had time to arrive */}
      {pastDeliveryWindow && (
        <div className="card rounded-2xl border border-[var(--info-500)]/30 bg-[var(--info-500)]/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-sm text-[var(--foreground)]">
              Has your order arrived?
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              It's been {DELIVERY_WINDOW_DAYS}+ days since it shipped. Let us know if you've received it.
            </p>
          </div>
          <button
            onClick={handleConfirmDelivery}
            disabled={isConfirming}
            className="btn-primary !w-auto px-5 h-10 text-sm disabled:opacity-50 flex-shrink-0"
          >
            {isConfirming ? "Confirming..." : "I've Received This Order"}
          </button>
        </div>
      )}

      {/* Items */}
      <div className="card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
          <HiOutlineShoppingBag className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">
            Items ({order.items?.length ?? 0})
          </span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {order.items?.map((item, idx) => {
            const isShipped = item.fulfillment?.status === "shipped";
            const isDelayed =
              !isShipped &&
              !!item.estimatedShipBy &&
              new Date(item.estimatedShipBy) < new Date();
            return (
              <div key={idx} className="flex items-center justify-between px-5 py-4 gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/posts/${item.product}`}
                    className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary-500)] transition-colors"
                  >
                    {item.productSnapshot.title}
                  </Link>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    Qty: {item.quantity}
                    {getOrderItemVariantLabel(item) && ` · ${getOrderItemVariantLabel(item)}`}
                    {item.storeSnapshot.name && ` · ${item.storeSnapshot.name}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge
                      tone={isShipped ? "success" : isDelayed ? "destructive" : "warning"}
                      label={isShipped ? "Shipped" : isDelayed ? "Delayed" : "Preparing"}
                    />
                    {isShipped && item.fulfillment?.shippedAt && (
                      <span className="text-[11px] text-[var(--foreground-muted)]">
                        on {formatDate(item.fulfillment.shippedAt)}
                      </span>
                    )}
                    {isShipped && item.fulfillment?.trackingCode && (
                      <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
                        · Tracking: {item.fulfillment.trackingCode}
                      </span>
                    )}
                    {!isShipped && item.estimatedShipBy && (
                      <span className="text-[11px] text-[var(--foreground-muted)]">
                        {isDelayed ? "Was expected by" : "Estimated ship by"} {formatDate(item.estimatedShipBy)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-black text-[var(--foreground)] flex-shrink-0">
                  ${(item.finalPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

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
        {order.status === "shipped" && !pastDeliveryWindow && (
          <button
            onClick={handleConfirmDelivery}
            disabled={isConfirming}
            className="btn-primary !w-auto px-5 h-10 text-sm disabled:opacity-50"
          >
            {isConfirming ? "Confirming..." : "I've Received This Order"}
          </button>
        )}
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
    </div>
  );
}