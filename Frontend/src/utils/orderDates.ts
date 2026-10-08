import { IOrder } from "@/types/Order";

type DateLike = string | Date | null | undefined;

const toDate = (value: DateLike): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "Sep 28, 2026" */
export const formatDay = (value: DateLike) =>
  toDate(value)?.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) ?? "";

/** "14:35" (24-hour) */
export const formatTime = (value: DateLike) =>
  toDate(value)?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "";

/** "Sep 28, 2026 · 14:35" */
export const formatDateTime = (value: DateLike) => {
  const date = toDate(value);
  return date ? `${formatDay(date)} · ${formatTime(date)}` : "";
};

/** when the order left: the order's own shippedAt, else the latest item that shipped */
export const getShippedAt = (order: IOrder): Date | null => {
  const own = toDate(order.shippedAt);
  if (own) return own;
  const times = (order.items ?? [])
    .map((item) => toDate(item.fulfillment?.shippedAt))
    .filter((d): d is Date => !!d)
    .map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : null;
};

/** when the order should reach the buyer: the order's roll-up, else the latest item estimate */
export const getExpectedDelivery = (order: IOrder): Date | null => {
  const own = toDate(order.expectedDeliveryAt);
  if (own) return own;
  const times = (order.items ?? [])
    .map((item) => toDate(item.fulfillment?.estimatedDeliveryAt))
    .filter((d): d is Date => !!d)
    .map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : null;
};

/** the latest "ship by" promise across the items (only meaningful before shipping) */
const getExpectedShipBy = (order: IOrder): Date | null => {
  const times = (order.items ?? [])
    .map((item) => toDate(item.estimatedShipBy))
    .filter((d): d is Date => !!d)
    .map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : null;
};

export type DeliveryTone = "success" | "info" | "warning" | "neutral" | "destructive";

export interface DeliveryInfo {
  label: string;
  date: Date | null;
  tone: DeliveryTone;
  /** short explanation shown under the date */
  note?: string;
}

/**
 * What to show in the "Delivery" column / box for one order.
 * deliveredAt is set when the buyer confirms receipt, when an admin marks it delivered,
 * or when the order is auto-completed after the waiting period (then it's not the real arrival time).
 */
export const getDeliveryInfo = (order: IOrder): DeliveryInfo => {
  if (order.status === "cancelled") {
    return { label: "Cancelled", date: null, tone: "destructive" };
  }

  if (order.status === "completed") {
    if (order.autoCompletedAt) {
      return {
        label: "Auto-completed",
        date: toDate(order.deliveredAt) ?? toDate(order.autoCompletedAt),
        tone: "success",
        note: "Receipt wasn't confirmed, closed automatically",
      };
    }
    return { label: "Delivered", date: toDate(order.deliveredAt), tone: "success" };
  }

  if (order.status === "shipped") {
    const expected = getExpectedDelivery(order);
    if (expected) {
      const late = expected.getTime() < Date.now();
      return {
        label: late ? "Was expected" : "Arriving",
        date: expected,
        tone: late ? "warning" : "info",
        note: late ? "Running late — contact support if it doesn't arrive soon" : "On its way",
      };
    }
    return { label: "Shipped", date: getShippedAt(order), tone: "info", note: "On its way" };
  }

  const expected = getExpectedShipBy(order);
  if (expected) {
    const late = expected.getTime() < Date.now();
    return {
      label: late ? "Was expected to ship" : "Ships by",
      date: expected,
      tone: late ? "warning" : "neutral",
    };
  }

  return { label: "Not shipped yet", date: null, tone: "neutral" };
};
