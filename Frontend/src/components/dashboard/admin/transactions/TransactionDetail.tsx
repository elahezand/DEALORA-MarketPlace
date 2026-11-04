"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineClock,
} from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import TransactionPackages from "./TransactionPackages";
import UpdateOrderCard from "./UpdateOrderCard";
import { CashDisputeNotice, TransactionItemRow, TransactionInfoCards } from "./TransactionInfoCards";
import { Badge } from "../../shared/table/TableParts";
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
import { useAdminCancelGroup, useAdminCancelItem } from "@/services/Order/useAdminCancelGroup";

/*
 * Same rules as the backend (services/admin/order.js → ALLOWED_STATUS_MOVES).
 * The current value is always listed first so the select never shows a blank.
 * An admin only CANCELS by hand. Completing happens when the buyer confirms, automatically
 * (online), or when the cash is confirmed by whoever received it (cash).
 */
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
  // the site's items are shipped together
  const [shipOpen, setShipOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [delivery, setDelivery] = useState<DeliveryTimeValue>(defaultDeliveryTime());
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  // part (store id or "site") whose arrival time is being changed
  const [etaTarget, setEtaTarget] = useState<{ key: string; name: string } | null>(null);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  const { mutate: updateOrder, isPending } = useUpdateOrder(orderId);
  const { mutate: shipItem, isPending: isShipping } = useAdminShipItem(() => {
    setShipOpen(false);
    setTrackingCode("");
  });

  const { mutate: setEstimate, isPending: isSavingEta } = useAdminSetDeliveryEstimate(() => setEtaTarget(null));
  const { mutate: confirmCash, isPending: isConfirmingCash } = useAdminCashReceived();

  const { mutate: reportMissing, isPending: isReporting } = useAdminCashNotReceived();
  const { mutate: cancelGroup, isPending: isCancellingGroup, variables: cancelVars } = useAdminCancelGroup();

  const { mutate: cancelItem, isPending: isCancellingItem, variables: cancelItemVars } = useAdminCancelItem();

  function handleCancelItem(item: IAdminOrderItem) {
    if (!window.confirm(`Cancel "${item.productSnapshot.title}"? Its stock goes back and the buyer is refunded for it.`)) return;
    cancelItem({ orderId, itemId: item._id });
  }

  function handleCancelGroup(group: string, name: string) {
    if (!window.confirm(`Cancel everything from ${name} in this order? Its stock goes back and the buyer is refunded for it.`)) return;
    cancelGroup({ orderId, group });
  }

  function handleCashNotReceived(items: IAdminOrderItem[]) {
    if (!order) return;
    const note = askCashNotReceived(items);
    if (note === null) return;
    reportMissing({ orderId, note: note || undefined });
  }

  function handleCashReceived() {
    if (!window.confirm("Confirm the site received the cash for its items in this order?")) return;
    confirmCash({ orderId });
  }

  function openShip() {
    setShipOpen(true);
    setTrackingCode("");
    setDelivery(defaultDeliveryTime());
    setDeliveryError(null);
  }

  function openEta(key: string, name: string, items: IAdminOrderItem[]) {
    const current = items.find((item) => item.fulfillment?.estimatedDeliveryAt)?.fulfillment?.estimatedDeliveryAt ?? null;
    setEtaTarget({ key, name });
    setDelivery(defaultDeliveryTime(current));
    setDeliveryError(null);
  }

  function submitShip(e: React.FormEvent) {
    e.preventDefault();
    const error = deliveryTimeError(delivery);
    setDeliveryError(error);
    if (error) return;
    shipItem({
      orderId,
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
    setEstimate({ orderId, group: etaTarget.key, estimatedDeliveryAt: deliveryTimeToIso(delivery)! });
  }

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
      <CashDisputeNotice order={order} />

      {/* Packages — each store's part is delivered, paid out and cancelled on its own */}
      <TransactionPackages
        order={order}
        onShip={openShip}
        onCashReceived={handleCashReceived}
        onCashNotReceived={handleCashNotReceived}
        onChangeEta={openEta}
        onCancelGroup={handleCancelGroup}
        isConfirmingCash={isConfirmingCash}
        isReporting={isReporting}
        cancellingGroup={isCancellingGroup ? cancelVars?.group : null}
      />

      <div className="card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
          <HiOutlineShoppingBag className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="font-bold text-[var(--foreground)] text-sm">
            Items ({order.items?.length ?? 0})
          </span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {order.items?.map((item, idx) => (
            <TransactionItemRow
              key={item._id ?? idx}
              item={item}
              order={order}
              onCancel={handleCancelItem}
              isCancelling={isCancellingItem && cancelItemVars?.itemId === item._id}
            />
          ))}
        </div>
      </div>

      <TransactionInfoCards order={order} />

      <UpdateOrderCard
        orderStatus={order.status}
        status={status}
        setStatus={setStatus}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        statusOptions={statusOptions}
        paymentOptions={paymentOptions}
        isLocked={isLocked}
        hasChanges={hasChanges}
        isPending={isPending}
        onSave={saveChanges}
      />

      {/* SHIP ITEM MODAL */}
      <AdminFormModal
        isOpen={shipOpen}
        onClose={() => setShipOpen(false)}
        title="Ship the Site's Items"
        icon={HiOutlineTruck}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShipOpen(false)}
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
            Confirm the site&apos;s items in this order were handed off for delivery. They all get the same
            tracking code and delivery time.
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
            New expected arrival for everything shipped from{" "}
            <span className="font-bold">{etaTarget?.name ?? "this part"}</span>.
          </p>
          <DeliveryTimeFields value={delivery} onChange={setDelivery} error={deliveryError} />
        </form>
      </AdminFormModal>
    </div>
  );
}