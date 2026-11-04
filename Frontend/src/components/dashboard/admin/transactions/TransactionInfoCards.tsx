"use client";

import { HiOutlineCreditCard, HiOutlineMapPin, HiOutlineBuildingStorefront } from "react-icons/hi2";
import Link from "next/link";
import { Badge, EntityAvatar } from "../../shared/table/TableParts";
import { IAdminOrder, IAdminOrderItem } from "@/types/Order";
import { formatDateTime } from "@/utils/orderDates";
import { getUrl } from "@/utils/helper";
import { getOrderItemVariantLabel } from "@/utils/orderItem";

/*
   presentational parts of the admin order page (TransactionDetail).
   they only render what they get, all actions stay in the parent.
*/

type Order = IAdminOrder;

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* cash on delivery: what's going on with the money */
export function CashDisputeNotice({ order }: { order: Order }) {
  return (
    <>
    {order.paymentMethod === "cash" && order.cashDispute?.reportedAt && (
      <div className="rounded-2xl border border-[var(--destructive)]/40 bg-[var(--destructive-bg)] p-4">
        <p className="text-sm font-bold text-[var(--destructive)]">
          {order.status === "cancelled" ? "Cancelled: cash not received" : "Cash dispute — needs your decision"}
        </p>
        <p className="text-xs text-[var(--foreground)] mt-1">
          Reported {formatDateTime(order.cashDispute.reportedAt)}
          {order.cashDispute.note ? ` — “${order.cashDispute.note}”` : ""}
        </p>
        {order.status !== "cancelled" && (
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {order.buyerConfirmedAt
              ? `The buyer confirmed receipt on ${formatDateTime(order.buyerConfirmedAt)}. `
              : ""}
            Talk to the buyer and the store. If the cash really wasn&apos;t paid, cancel the order below;
            if it was, ask the store to press “Cash received”.
          </p>
        )}
      </div>
    )}
    {order.paymentMethod === "cash" && !order.cashDispute?.reportedAt && order.buyerConfirmedAt && order.paymentStatus !== "paid" && (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] p-4 text-xs text-[var(--foreground-muted)]">
        The buyer confirmed receipt on {formatDateTime(order.buyerConfirmedAt)} — waiting for the cash to be confirmed.
      </div>
    )}
    </>
  );
}

interface TransactionItemRowProps {
  item: IAdminOrderItem;
  order: Order;
  onCancel: (item: IAdminOrderItem) => void;
  isCancelling: boolean;
}

export function TransactionItemRow({ item, order, onCancel, isCancelling }: TransactionItemRowProps) {
  const sellerName = item.storeSnapshot.name;
  // a store's item → its cash went to the store; no store → the site got the cash
  const isStoreItem = !!item.store;
  const title = item.productSnapshot.title;
  const productId = typeof item.productId === "object" ? item.productId?._id : item.productId;
  const isShipped = item.fulfillment?.status === "shipped";
  const isCancelled = !!item.cancelledAt;
  const isDelivered = !!item.deliveredAt;
  const isOpen = !isCancelled && !isDelivered && ["processing", "shipped"].includes(order.status);

  return (
    <div
      className="flex items-center justify-between px-5 py-4 gap-3"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <EntityAvatar
          src={getUrl(item.productSnapshot.image)}
          alt={title}
          fallback={title.slice(0, 2).toUpperCase()}
          shape="square"
        />
        <div className="min-w-0">
          <Link
            href={`/posts/${productId}`}
            className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary-500)] transition-colors truncate block"
          >
            {title}
          </Link>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Qty: {item.quantity}
            {getOrderItemVariantLabel(item) && ` · ${getOrderItemVariantLabel(item)}`}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {sellerName ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--foreground-muted)] bg-[var(--background-soft)] px-1.5 py-0.5 rounded">
                <HiOutlineBuildingStorefront className="w-3 h-3" />
                {sellerName}
              </span>
            ) : item.needsAdminShipment ? (
              <span className="text-[10px] font-bold text-[var(--primary-500)] bg-[var(--primary-500)]/10 px-1.5 py-0.5 rounded">
                Sold by site
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[var(--foreground-subtle)] bg-[var(--background-soft)] px-1.5 py-0.5 rounded">
                Personal ad
              </span>
            )}
            {isCancelled ? (
              <Badge tone="destructive" label="Cancelled" />
            ) : isDelivered ? (
              <Badge tone="success" label="Delivered" />
            ) : item.fulfillment && (
              <Badge
                tone={isShipped ? "info" : "warning"}
                label={isShipped ? "Shipped" : "Pending shipment"}
              />
            )}
          </div>
          {isShipped && item.fulfillment?.trackingCode && (
            <p className="text-[11px] text-[var(--success-500)] mt-1">
              Tracking: {item.fulfillment.trackingCode}
            </p>
          )}
          {isShipped && (
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
              {item.fulfillment?.estimatedDeliveryAt
                ? `Expected delivery: ${formatDateTime(item.fulfillment.estimatedDeliveryAt)}`
                : "No delivery time set"}
            </p>
          )}
          {order.paymentMethod === "cash" && (
            <p className={`text-[11px] mt-0.5 font-semibold ${item.cashCollectedAt ? "text-[var(--success-500)]" : "text-[var(--warning-500)]"}`}>
              {item.cashCollectedAt
                ? `Cash received ${formatDateTime(item.cashCollectedAt)}`
                : isStoreItem
                  ? `Cash is paid to ${sellerName || "the store"} — they confirm it`
                  : "Cash is paid to the site — confirm when received"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <p className="text-sm font-black text-[var(--foreground)]">
          ${(item.finalPrice * item.quantity).toLocaleString()}
        </p>
        {isOpen && item._id && (
          <button
            type="button"
            onClick={() => onCancel(item)}
            disabled={isCancelling}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isCancelling ? "Cancelling..." : "Cancel item"}
          </button>
        )}
      </div>
    </div>
  );
}

/* payment summary + shipping address */
export function TransactionInfoCards({ order }: { order: Order }) {
  const buyer = typeof order.user === "object" ? order.user : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineCreditCard className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">
            Payment
          </span>
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
        <p className="text-xs text-[var(--foreground-muted)]">
          Buyer: {buyer?.username || "—"} {buyer?.phone ? `· ${buyer.phone}` : ""}
        </p>
      </div>

      <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineMapPin className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">
            Shipping Address
          </span>
        </div>
        {order.shippingAddress ? (
          <div className="text-sm text-[var(--foreground)] leading-relaxed">
            <p className="font-semibold">{order.shippingAddress.name}</p>
            <p className="text-[var(--foreground-muted)]">
              {order.shippingAddress.address}
            </p>
            <p className="text-[var(--foreground-muted)]">
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            <p className="text-[var(--foreground-muted)]">
              {order.shippingAddress.postalCode}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">
            No address on file
          </p>
        )}
      </div>
    </div>
  );
}
