import { OrderStatus, ISellerOrder } from "@/types/Order";
import { itemDueTime } from "@/utils/orderDates";

/* helpers for the seller orders page: this store's own part of an order */

/** latest expected arrival among this seller's shipped items */
export const getSellerEta = (order: ISellerOrder): Date | null => {
    const times = order.items
        .map((item) => item.fulfillment?.estimatedDeliveryAt)
        .filter(Boolean)
        .map((d) => new Date(d as string).getTime());
    return times.length ? new Date(Math.max(...times)) : null;
};

/** cash-on-delivery order where this store delivered its items but hasn't confirmed the cash yet */
// this store's own part (other stores in the same order don't matter)
export const myStatusOf = (order: ISellerOrder): OrderStatus => order.myStatus ?? order.status;
export const myActiveItems = (order: ISellerOrder) => order.items.filter((item) => !item.cancelledAt);

/** cash order: this store delivered its items but hasn't confirmed the cash yet */
export const awaitingMyCash = (order: ISellerOrder) =>
    order.paymentMethod === "cash" &&
    myStatusOf(order) === "shipped" &&
    myActiveItems(order).some((item) => !item.cashCollectedAt);

/** "Not received" only after the delivery time, and not while an admin reviews a dispute */
export const canReportMissingCash = (order: ISellerOrder) =>
    awaitingMyCash(order) &&
    !order.cashDispute?.reportedAt &&
    myActiveItems(order).every((item) => Date.now() >= itemDueTime(item));

export const getTrackingCode = (order: ISellerOrder) =>
    order.items.find((item) => item.fulfillment?.trackingCode)?.fulfillment?.trackingCode ?? "";

export const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "destructive" | "neutral" | "info"> = {
    created: "neutral",
    processing: "info",
    shipped: "warning",
    completed: "success",
    cancelled: "destructive",
};

/* downloads the given orders as a CSV file (Excel-friendly, with BOM) */
export function exportOrdersCsv(filteredOrders: ISellerOrder[], status: string) {
    const header = ["Order ID", "Buyer", "Phone", "Items", "Your Revenue", "Status", "Tracking Code", "Date"];
    const rows = filteredOrders.map((order) => {
        const buyer = typeof order.user === "object" ? order.user : null;
        const itemsSummary = order.items
            .map((item) => {
                const p = typeof item.productId === "object" ? item.productId : null;
                return `${p?.title ?? "item"} x${item.quantity}`;
            })
            .join("; ");

        return [
            order._id.slice(-6).toUpperCase(),
            buyer?.username ?? "",
            buyer?.phone ?? "",
            itemsSummary,
            order.mySubtotal ?? 0,
            order.status,
            getTrackingCode(order),
            new Date(order.createdAt).toLocaleDateString(),
        ];
    });

    const escapeCell = (cell: string | number) => {
        const s = String(cell);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${status}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
