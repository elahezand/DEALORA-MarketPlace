"use client";

import { useState } from "react";
import { HiOutlineClipboardDocumentList, HiOutlineTruck, HiOutlineEye, HiOutlineMagnifyingGlass, HiOutlineArrowDownTray, HiOutlineClock, HiOutlineBanknotes } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass } from "../../(admin)/shared/AdminFormModal";
import { useShipOrder } from "@/services/Order/useShipOrder";
import { useSellerSetDeliveryEstimate } from "@/services/Order/useSetDeliveryEstimate";
import { useSellerCashReceived, useSellerCashNotReceived, askCashNotReceived } from "@/services/Order/useCashReceived";
import DeliveryTimeFields, {
    DeliveryTimeValue,
    defaultDeliveryTime,
    deliveryTimeError,
    deliveryTimeToIso,
} from "../../shared/DeliveryTimeFields";
import { formatDateTime } from "@/utils/orderDates";
import { OrderStatus, ISellerOrder, SellerOrdersResponse } from "@/types/Order";
import { QueryParams } from "@/types/api/ErrorTypes";
import { getUrl } from "@/utils/helper";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";

/** latest expected arrival among this seller's shipped items */
const getSellerEta = (order: ISellerOrder): Date | null => {
    const times = order.items
        .map((item) => item.fulfillment?.estimatedDeliveryAt)
        .filter(Boolean)
        .map((d) => new Date(d as string).getTime());
    return times.length ? new Date(Math.max(...times)) : null;
};

/** cash-on-delivery order where this store delivered its items but hasn't confirmed the cash yet */
const awaitingMyCash = (order: ISellerOrder) =>
    order.paymentMethod === "cash" &&
    ["processing", "shipped"].includes(order.status) &&
    order.items.length > 0 &&
    order.items.every((item) => item.fulfillment?.status === "shipped") &&
    order.items.some((item) => !item.cashCollectedAt) &&
    !order.cashDispute?.reportedAt;
// "Not received" only after every item's delivery time
const pastDeliveryTime = (order: ISellerOrder) =>
    order.items.every((item) => {
        const eta = item.fulfillment?.estimatedDeliveryAt;
        const shipped = item.fulfillment?.shippedAt;
        const due = eta
            ? new Date(eta).getTime()
            : shipped ? new Date(shipped).getTime() + 3 * 24 * 60 * 60 * 1000 : 0;
        return Date.now() >= due;
    });
const getTrackingCode = (order: ISellerOrder) =>
    order.items.find((item) => item.fulfillment?.trackingCode)?.fulfillment?.trackingCode ?? "";

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "destructive" | "neutral" | "info"> = {
    created: "neutral",
    processing: "info",
    shipped: "warning",
    completed: "success",
    cancelled: "destructive",
};

interface MyOrdersPageProps {
    initialData?: InfiniteData<SellerOrdersResponse>;
}

const ENDPOINT = "/orders/seller"

export default function MyOrdersPage({ initialData }: MyOrdersPageProps) {
    const [filters, setFilters] = useState<TableFilterValue>(emptyFilters);
    const [status, setStatus] = useState<OrderStatus | "all">("processing");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewTarget, setViewTarget] = useState<ISellerOrder | null>(null);
    const [shipTarget, setShipTarget] = useState<ISellerOrder | null>(null);
    const [trackingCode, setTrackingCode] = useState("");
    const [delivery, setDelivery] = useState<DeliveryTimeValue>(defaultDeliveryTime());
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    // order whose (already shipped) delivery time is being changed
    const [etaTarget, setEtaTarget] = useState<ISellerOrder | null>(null);

    const params: QueryParams = { limit: 20, ...(status !== "all" && { status }), ...filtersToParams(filters) };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteGet(ENDPOINT,
        params, {
        queryKey: ["/orders/seller", status, filtersKey(filters)],
        initialData: status === "processing" && filtersKey(filters) === "{}" ? initialData : undefined,
    });

    const orders: ISellerOrder[] = (
        data?.pages?.flatMap((page: SellerOrdersResponse) => page?.data ?? []) || []
    ).filter(Boolean);


    const filteredOrders = orders.filter((order) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        const buyer = typeof order.user === "object" ? order.user : null;
        const shortId = order._id.slice(-6).toLowerCase();
        return (
            shortId.includes(q) ||
            order._id.toLowerCase().includes(q) ||
            buyer?.username?.toLowerCase().includes(q) ||
            buyer?.phone?.toLowerCase().includes(q)
        );
    });

    function exportCsv() {
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

    const { mutate: shipOrder, isPending: isShipping } = useShipOrder(() => {
        setShipTarget(null);
        setTrackingCode("");
    });
    const { mutate: setEstimate, isPending: isSavingEta } = useSellerSetDeliveryEstimate(() => setEtaTarget(null));
    const { mutate: confirmCash, isPending: isConfirmingCash, variables: cashOrderId } = useSellerCashReceived();

    const { mutate: reportMissing, isPending: isReporting, variables: reportVars } = useSellerCashNotReceived();

    function handleCashNotReceived(order: ISellerOrder) {
        const note = askCashNotReceived(order);
        if (note === null) return;
        reportMissing({ orderId: order._id, note: note || undefined });
    }

    function handleCashReceived(order: ISellerOrder) {
        const amount = order.mySubtotal?.toLocaleString() ?? "";
        if (!window.confirm(`Confirm you received ${amount ? `$${amount} ` : ""}in cash for order #${order._id.slice(-6).toUpperCase()}?`)) return;
        confirmCash(order._id);
    }

    function openShip(order: ISellerOrder) {
        setShipTarget(order);
        setTrackingCode("");
        setDelivery(defaultDeliveryTime());
        setDeliveryError(null);
    }

    function openEta(order: ISellerOrder) {
        setEtaTarget(order);
        setDelivery(defaultDeliveryTime(getSellerEta(order)));
        setDeliveryError(null);
    }

    function submitShip(e: React.FormEvent) {
        e.preventDefault();
        if (!shipTarget) return;
        const error = deliveryTimeError(delivery);
        setDeliveryError(error);
        if (error) return;
        shipOrder({
            order: shipTarget,
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
        setEstimate({ order: etaTarget, estimatedDeliveryAt: deliveryTimeToIso(delivery)! });
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div>
                <p className="menu-section-title mb-1">Seller</p>
                <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Orders</h1>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setStatus(tab.value)}
                            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${status === tab.value
                                ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
                                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={filteredOrders.length === 0}
                        className="text-xs font-bold px-3 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors flex items-center gap-1.5 disabled:opacity-40"
                        title="Export the orders currently loaded to CSV"
                    >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <TableFilters value={filters} onChange={setFilters} withSearch={false} />


            <TableCard
                header={<WidgetHeader icon={HiOutlineClipboardDocumentList} title="Orders including your products" href="/dashboard/seller/orders" />}
                isLoading={isLoading}
                isError={isError}
                isEmpty={filteredOrders.length === 0}
                errorMessage="Error fetching your orders"
                emptyTitle={searchQuery ? "No matching orders" : "No orders yet"}
                emptyMessage={searchQuery ? "Try a different search, or Load More to search older orders" : "Orders that include your store's products will show up here"}
            >
                <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
                    <tr>
                        <Th>Order</Th>
                        <Th>Buyer</Th>
                        <Th>Items</Th>
                        <Th>Your Revenue</Th>
                        <Th>Status</Th>
                        <Th align="right">Date</Th>
                        <Th align="right">Actions</Th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => {
                        const buyer = typeof order.user === "object" ? order.user : null;
                        const firstItem = order.items[0];
                        const firstProduct = firstItem && typeof firstItem.productId === "object" ? firstItem.productId : null;
                        const extraCount = order.items.length - 1;
                        const shortId = order._id.slice(-6).toUpperCase();

                        return (
                            <tr key={order._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-mono text-xs font-bold text-[var(--foreground)]">#{shortId}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-[var(--foreground)]">{buyer?.username || "—"}</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">{buyer?.phone || ""}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <EntityAvatar
                                            src={getUrl(firstProduct?.images?.[0])}
                                            alt={firstProduct?.title ?? "product"}
                                            fallback={(firstProduct?.title ?? "?").slice(0, 2).toUpperCase()}
                                            shape="square"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-[var(--foreground)] truncate max-w-[160px]">
                                                {firstProduct?.title || "—"}
                                                {firstItem ? ` ×${firstItem.quantity}` : ""}
                                            </p>
                                            {extraCount > 0 && (
                                                <p className="text-xs text-[var(--foreground-muted)]">+{extraCount} more item{extraCount > 1 ? "s" : ""}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                                    ${order.mySubtotal?.toLocaleString() ?? 0}
                                </td>
                                <td className="px-6 py-4">
                                    <Badge tone={STATUS_TONE[order.status] ?? "neutral"} label={order.status} />
                                    {order.paymentMethod === "cash" && (
                                        <p className={`text-[11px] font-semibold mt-1 whitespace-nowrap ${order.items.every((i) => i.cashCollectedAt)
                                            ? "text-[var(--success-500)]"
                                            : "text-[var(--warning-500)]"}`}>
                                            {order.items.every((i) => i.cashCollectedAt)
                                                ? "💵 Cash received"
                                                : "💵 Cash on delivery — paid to you"}
                                        </p>
                                    )}
                                    {order.cashDispute?.reportedAt && order.status !== "cancelled" && (
                                        <p className="text-[11px] font-semibold mt-1 whitespace-nowrap text-[var(--destructive)]">
                                            ⚠ Cash reported missing — admin reviewing
                                        </p>
                                    )}
                                    {order.paymentMethod === "cash" && order.buyerConfirmedAt && order.paymentStatus !== "paid" && !order.cashDispute?.reportedAt && (
                                        <p className="text-[11px] mt-1 whitespace-nowrap text-[var(--foreground-muted)]">
                                            Buyer confirmed receipt
                                        </p>
                                    )}
                                    {getSellerEta(order) && order.status !== "completed" && order.status !== "cancelled" && (
                                        <p className="text-[11px] text-[var(--foreground-muted)] mt-1 whitespace-nowrap">
                                            Arrives {formatDateTime(getSellerEta(order))}
                                        </p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-right text-[var(--foreground-muted)]">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setViewTarget(order)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                                            aria-label="View details"
                                            title="View details"
                                        >
                                            <HiOutlineEye className="w-4 h-4" />
                                        </button>
                                        {order.status === "processing" && order.myFulfillmentStatus !== "shipped" && (
                                            <button
                                                type="button"
                                                onClick={() => openShip(order)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--primary-500)]/30 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10 transition-colors flex items-center gap-1.5"
                                            >
                                                <HiOutlineTruck className="w-4 h-4" />
                                                Ship
                                            </button>
                                        )}
                                        {awaitingMyCash(order) && (
                                            <button
                                                type="button"
                                                onClick={() => handleCashReceived(order)}
                                                disabled={isConfirmingCash && cashOrderId === order._id}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/40 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                            >
                                                <HiOutlineBanknotes className="w-4 h-4" />
                                                {isConfirmingCash && cashOrderId === order._id ? "Saving..." : "Cash received"}
                                            </button>
                                        )}
                                        {awaitingMyCash(order) && pastDeliveryTime(order) && 
                                        (<button
                                            type="button"
                                            onClick={() => handleCashNotReceived(order)}
                                            disabled={isReporting && reportVars?.orderId === order._id}
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {isReporting && reportVars?.orderId === order._id ? "Saving..." : "Not received"}
                                        </button>
                                        )}
                                        {order.myFulfillmentStatus !== "pending" && ["processing", "shipped"].includes(order.status) && (
                                            <button
                                                type="button"
                                                onClick={() => openEta(order)}
                                                title="Change delivery time"
                                                aria-label="Change delivery time"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                                            >
                                                <HiOutlineClock className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableCard>

            {hasNextPage && (
                <div className="flex justify-center w-full">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
                    >
                        <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
                        <HiChevronRight className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""}`} />
                    </button>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            <AdminFormModal
                isOpen={!!viewTarget}
                onClose={() => setViewTarget(null)}
                title={viewTarget ? `Order #${viewTarget._id.slice(-6).toUpperCase()}` : "Order"}
                icon={HiOutlineClipboardDocumentList}
                maxWidth="max-w-[640px]"
            >
                {viewTarget && (
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge tone={STATUS_TONE[viewTarget.status] ?? "neutral"} label={viewTarget.status} />
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Placed {new Date(viewTarget.createdAt).toLocaleString()}
                            </p>
                        </div>

                        {getTrackingCode(viewTarget) && (
                            <div className="text-sm">
                                <span className="text-[var(--foreground-muted)]">Tracking code: </span>
                                <span className="font-mono font-bold text-[var(--foreground)]">{getTrackingCode(viewTarget)}</span>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-2">Buyer</p>
                            <p className="text-sm text-[var(--foreground)]">
                                {typeof viewTarget.user === "object" ? viewTarget.user.username : "—"}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {typeof viewTarget.user === "object" ? viewTarget.user.phone : ""}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-2">
                                Shipping Address
                            </p>
                            <p className="text-sm text-[var(--foreground)]">
                                {viewTarget.shippingAddress?.address}, {viewTarget.shippingAddress?.city},{" "}
                                {viewTarget.shippingAddress?.state} {viewTarget.shippingAddress?.postalCode}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-2">
                                Your Items
                            </p>
                            <div className="flex flex-col gap-2">
                                {viewTarget.items.map((item, i) => {
                                    const p = typeof item.productId === "object" ? item.productId : null;
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background-soft)]">
                                            <EntityAvatar
                                                src={getUrl(p?.images?.[0])}
                                                alt={p?.title ?? "product"}
                                                fallback={(p?.title ?? "?").slice(0, 2).toUpperCase()}
                                                shape="square"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--foreground)] truncate">{p?.title || "—"}</p>
                                                <p className="text-xs text-[var(--foreground-muted)]">
                                                    Qty {item.quantity} × ${item.finalPrice.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                                <p className="text-sm font-bold text-[var(--foreground)]">Your revenue</p>
                                <p className="text-sm font-black text-[var(--foreground)]">
                                    ${viewTarget.mySubtotal?.toLocaleString() ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </AdminFormModal>

            {/* SHIP MODAL */}
            <AdminFormModal
                isOpen={!!shipTarget}
                onClose={() => setShipTarget(null)}
                title="Mark as Shipped"
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
                            form="ship-order-form"
                            disabled={isShipping}
                            className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
                        >
                            {isShipping ? "Saving..." : "Mark as Shipped"}
                        </button>
                    </>
                }
            >
                <form id="ship-order-form" onSubmit={submitShip} className="flex flex-col gap-4">
                    <p className="text-sm text-[var(--foreground)]">
                        Confirm order #{shipTarget?._id.slice(-6).toUpperCase()} has been handed off for delivery.
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
                            form="eta-order-form"
                            disabled={isSavingEta}
                            className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
                        >
                            {isSavingEta ? "Saving..." : "Save & notify buyer"}
                        </button>
                    </>
                }
            >
                <form id="eta-order-form" onSubmit={submitEta} className="flex flex-col gap-4">
                    <p className="text-sm text-[var(--foreground)]">
                        New expected arrival for order #{etaTarget?._id.slice(-6).toUpperCase()}.
                    </p>
                    <DeliveryTimeFields value={delivery} onChange={setDelivery} error={deliveryError} />
                </form>
            </AdminFormModal>
        </div>
    );
}