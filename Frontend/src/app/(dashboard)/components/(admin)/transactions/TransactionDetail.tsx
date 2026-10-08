"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineBuildingStorefront,
  HiOutlineClock,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { Badge, EntityAvatar } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass } from "../shared/AdminFormModal";
import { OrderStatus, PaymentStatus, AdminOrderResponse, IAdminOrderItem } from "@/types/Order";
import { useUpdateOrder } from "@/services/Order/useUpdateOrder";
import { useAdminShipItem } from "@/services/Order/useAdminShipItem";
import { useAdminSetDeliveryEstimate } from "@/services/Order/useSetDeliveryEstimate";
import { useAdminCashReceived, useAdminCashNotReceived, askCashNotReceived } from "@/services/Order/useCashReceived";
import DeliveryTimeFields, {
  DeliveryTimeValue,
  defaultDeliveryTime,
  deliveryTimeError,
  deliveryTimeToIso,
} from "../../shared/DeliveryTimeFields";
import { formatDateTime } from "@/utils/orderDates";
import { getUrl } from "@/utils/helper";
import { getOrderItemVariantLabel } from "@/utils/orderItem";


const STATUS_MOVES: Record<OrderStatus, OrderStatus[]> = {
  created: ["cancelled"],
  processing: ["cancelled"],
  shipped: ["cancelled"],
  completed: [],
  cancelled: [],
};

// cash is confirmed with "Cash received" per item, never by changing the payment status
const paymentMoves = (current: PaymentStatus, method?: string): PaymentStatus[] =>
  method !== "cash" && current === "pending" ? ["failed"] : [];

const STATUS_TONE: Record<
  OrderStatus,
  "success" | "warning" | "destructive" | "neutral" | "info"
> = {
  created: "neutral",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
};

const PAYMENT_TONE: Record<
  PaymentStatus,
  "success" | "warning" | "destructive" | "neutral"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "neutral",
};

interface TransactionDetailProps {
  orderId: string;
  initialData?: AdminOrderResponse;
}

export default function TransactionDetail({
  orderId,
  initialData,
}: TransactionDetailProps) {
  const endpoint = `/orders/admin/${orderId}`;

  const { data, isLoading, isError } = useGet<AdminOrderResponse>(
    endpoint,
    undefined,
    { queryKey: ["admin-order", orderId], initialData }
  );
  const order = data?.data ?? null;

  const [status, setStatus] = useState<OrderStatus>("created");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [shipTarget, setShipTarget] = useState<IAdminOrderItem | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [delivery, setDelivery] = useState<DeliveryTimeValue>(defaultDeliveryTime());
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  // shipped item whose expected arrival is being changed
  const [etaTarget, setEtaTarget] = useState<IAdminOrderItem | null>(null);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  const { mutate: updateOrder, isPending } = useUpdateOrder(orderId);
  const { mutate: shipItem, isPending: isShipping } = useAdminShipItem(() => {
    setShipTarget(null);
    setTrackingCode("");
  });

  const { mutate: setEstimate, isPending: isSavingEta } = useAdminSetDeliveryEstimate(() => setEtaTarget(null));
  const { mutate: confirmCash, isPending: isConfirmingCash, variables: cashVars } = useAdminCashReceived();

  const { mutate: reportMissing, isPending: isReporting, variables: reportVars } = useAdminCashNotReceived();

  function handleCashNotReceived(item: IAdminOrderItem) {
    if (!order) return;
    const note = askCashNotReceived(order);
    if (note === null) return;
    reportMissing({ orderId, itemId: item._id, note: note || undefined });
  }

  function handleCashReceived(item: IAdminOrderItem) {
    if (!window.confirm(`Confirm the site received the cash for "${item.productSnapshot.title}"?`)) return;
    confirmCash({ orderId, itemId: item._id });
  }

  function openShip(item: IAdminOrderItem) {
    setShipTarget(item);
    setTrackingCode("");
    setDelivery(defaultDeliveryTime());
    setDeliveryError(null);
  }

  function openEta(item: IAdminOrderItem) {
    setEtaTarget(item);
    setDelivery(defaultDeliveryTime(item.fulfillment?.estimatedDeliveryAt ?? null));
    setDeliveryError(null);
  }

  function submitShip(e: React.FormEvent) {
    e.preventDefault();
    if (!shipTarget) return;
    const error = deliveryTimeError(delivery);
    setDeliveryError(error);
    if (error) return;
    shipItem({
      orderId,
      itemId: shipTarget._id,
      trackingCode: trackingCode.trim() || undefined,
      estimatedDeliveryAt: deliveryTimeToIso(delivery) ?? undefined,
    });
  }

  function submitEta(e: React.FormEvent) {
    e.preventDefault();
    if (!etaTarget) return;
    const error = deliveryTimeError(delivery);
    setDeliveryError(error);
    if (error) return;
    setEstimate({ orderId, itemId: etaTarget._id, estimatedDeliveryAt: deliveryTimeToIso(delivery)! });
  }

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-[var(--background-soft)] rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-[var(--foreground)] font-bold">Order not found</p>
        <Link
          href="/dashboard/admin/transactions"
          className="btn-primary !w-auto px-5 h-10 text-sm mt-2"
        >
          Back to Transactions
        </Link>
      </div>
    );
  }

  const hasChanges =
    status !== order.status || paymentStatus !== order.paymentStatus;

  const statusOptions: OrderStatus[] = [order.status, ...(STATUS_MOVES[order.status] ?? [])];
  const paymentOptions: PaymentStatus[] = [
    order.paymentStatus,
    ...paymentMoves(order.paymentStatus, order.paymentMethod),
  ];
  const isLocked = statusOptions.length === 1 && paymentOptions.length === 1;

  function saveChanges() {
    // send only what changed — resending an unchanged status used to fail validation
    const payload: Partial<{ status: OrderStatus; paymentStatus: PaymentStatus }> = {};
    if (status !== order!.status) payload.status = status;
    if (paymentStatus !== order!.paymentStatus) payload.paymentStatus = paymentStatus;
    if (payload.status === "cancelled" && !window.confirm("Cancel this order? Stock is returned and the buyer is refunded to their wallet.")) {
      return;
    }
    updateOrder(payload);
  }

  const buyer = typeof order.user === "object" ? order.user : null;

  return (
    <div className="flex flex-col gap-6 pb-10 mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link aria-label="Back to transactions"
            href="/dashboard/admin/transactions"
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
          <Badge tone={STATUS_TONE[order.status]} label={order.status} />
          <Badge
            tone={PAYMENT_TONE[order.paymentStatus]}
            label={order.paymentStatus}
          />
        </div>
      </div>

      {/* cash on delivery: what's going on with the money */}
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
              Talk to the buyer and the store. If the cash really wasn't paid, cancel the order below;
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

      <div className="card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
          <HiOutlineShoppingBag className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">
            Items ({order.items?.length ?? 0})
          </span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {order.items?.map((item, idx) => {
            const sellerName = item.storeSnapshot.name;
            const isStoreItem = !!item.store;
            const eta = item.fulfillment?.estimatedDeliveryAt;
            const shipped = item.fulfillment?.shippedAt;
            const dueTime = eta
              ? new Date(eta).getTime()
              : shipped ? new Date(shipped).getTime() + 3 * 24 * 60 * 60 * 1000 : 0;
            const pastDue = Date.now() >= dueTime;
            const title = item.productSnapshot.title;
            const productId = typeof item.productId === "object" ? item.productId?._id : item.productId;
            const isShipped = item.fulfillment?.status === "shipped";

            return (
              <div
                key={item._id ?? idx}
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
                      {item.fulfillment && (
                        <Badge
                          tone={isShipped ? "success" : "warning"}
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
                  {order.paymentMethod === "cash" && !isStoreItem && isShipped && !item.cashCollectedAt
                    && !order.cashDispute?.reportedAt && ["processing", "shipped"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleCashReceived(item)}
                        disabled={isConfirmingCash && cashVars?.itemId === item._id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/40 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                      >
                        <HiOutlineBanknotes className="w-4 h-4" />
                        {isConfirmingCash && cashVars?.itemId === item._id ? "Saving..." : "Cash received"}
                      </button>
                    )}
                  {order.paymentMethod === "cash" && !isStoreItem && isShipped && !item.cashCollectedAt
                    && !order.cashDispute?.reportedAt && pastDue && ["processing", "shipped"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleCashNotReceived(item)}
                        disabled={isReporting && reportVars?.itemId === item._id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isReporting && reportVars?.itemId === item._id ? "Saving..." : "Not received"}
                      </button>
                    )}
                  {isShipped && item._id && ["processing", "shipped"].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => openEta(item)}
                      title="Change delivery time"
                      aria-label="Change delivery time"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                    >
                      <HiOutlineClock className="w-4 h-4" />
                    </button>
                  )}
                  {!isShipped && item._id && item.needsAdminShipment && (
                    <button
                      type="button"
                      onClick={() => openShip(item)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--primary-500)]/30 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10 transition-colors flex items-center gap-1.5"
                    >
                      <HiOutlineTruck className="w-4 h-4" />
                      Ship
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
            {order.status === "shipped" && (
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

      {/* SHIP ITEM MODAL */}
      <AdminFormModal
        isOpen={!!shipTarget}
        onClose={() => setShipTarget(null)}
        title="Mark Item as Shipped"
        icon={HiOutlineTruck}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShipTarget(null)}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="admin-ship-item-form"
              disabled={isShipping}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isShipping ? "Saving..." : "Mark as Shipped"}
            </button>
          </>
        }
      >
        <form id="admin-ship-item-form" onSubmit={submitShip} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--foreground)]">
            Confirm{" "}
            <span className="font-bold">
              {shipTarget?.productSnapshot.title ?? "this item"}
            </span>{" "}
            has been handed off for delivery.
          </p>
          <DeliveryTimeFields value={delivery} onChange={setDelivery} error={deliveryError} />
          <FormField label="Tracking code (optional)">
            <input
              type="text"
              className={inputClass}
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="e.g. postal tracking number"
            />
          </FormField>
        </form>
      </AdminFormModal>

      {/* CHANGE DELIVERY TIME MODAL */}
      <AdminFormModal
        isOpen={!!etaTarget}
        onClose={() => setEtaTarget(null)}
        title="Change Delivery Time"
        icon={HiOutlineClock}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEtaTarget(null)}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="admin-eta-form"
              disabled={isSavingEta}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isSavingEta ? "Saving..." : "Save & notify buyer"}
            </button>
          </>
        }
      >
        <form id="admin-eta-form" onSubmit={submitEta} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--foreground)]">
            New expected arrival for{" "}
            <span className="font-bold">{etaTarget?.productSnapshot.title ?? "this item"}</span>.
          </p>
          <DeliveryTimeFields value={delivery} onChange={setDelivery} error={deliveryError} />
        </form>
      </AdminFormModal>
    </div>
  );
}