"use client";

import { useState } from "react";
import { HiOutlineClipboardDocumentList, HiOutlineTruck, HiOutlineArrowDownTray, HiOutlineClock } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass } from "../../admin/shared/AdminFormModal";
import { useShipOrder } from "@/services/Order/useShipOrder";
import { useSellerSetDeliveryEstimate } from "@/services/Order/useSetDeliveryEstimate";
import { useSellerCashReceived, useSellerCashNotReceived, askCashNotReceived } from "@/services/Order/useCashReceived";
import DeliveryTimeFields, {
    DeliveryTimeValue,
    defaultDeliveryTime,
    deliveryTimeError,
    deliveryTimeToIso,
} from "../../shared/DeliveryTimeFields";
import { OrderStatus, ISellerOrder, SellerOrdersResponse } from "@/types/Order";
import { QueryParams } from "@/types/api/ErrorTypes";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import SellerOrderRow from "./SellerOrderRow";
import SellerOrderDetails from "./SellerOrderDetails";
import { STATUS_TABS, exportOrdersCsv, getSellerEta } from "./sellerOrderUtils";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";


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

    const exportCsv = () => exportOrdersCsv(filteredOrders, status);

    const { mutate: shipOrder, isPending: isShipping } = useShipOrder(() => {
        setShipTarget(null);
        setTrackingCode("");
    });
    const { mutate: setEstimate, isPending: isSavingEta } = useSellerSetDeliveryEstimate(() => setEtaTarget(null));
    const { mutate: confirmCash, isPending: isConfirmingCash, variables: cashOrderId } = useSellerCashReceived();

    const { mutate: reportMissing, isPending: isReporting, variables: reportVars } = useSellerCashNotReceived();

    function handleCashNotReceived(order: ISellerOrder) {
        const note = askCashNotReceived(order.items);
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
                    {filteredOrders.map((order) => (
                        <SellerOrderRow
                            key={order._id}
                            order={order}
                            onView={setViewTarget}
                            onShip={openShip}
                            onChangeEta={openEta}
                            onCashReceived={handleCashReceived}
                            onCashNotReceived={handleCashNotReceived}
                            isConfirmingCash={isConfirmingCash && cashOrderId === order._id}
                            isReporting={isReporting && reportVars?.orderId === order._id}
                        />
                    ))}
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
                {viewTarget && <SellerOrderDetails order={viewTarget} />}
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