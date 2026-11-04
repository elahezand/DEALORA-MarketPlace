"use client";

import { HiOutlineTruck, HiOutlineEye, HiOutlineClock, HiOutlineBanknotes } from "react-icons/hi2";
import { EntityAvatar, Badge } from "../../shared/table/TableParts";
import { ISellerOrder } from "@/types/Order";
import { formatDateTime } from "@/utils/orderDates";
import { getUrl } from "@/utils/helper";
import { STATUS_TONE, awaitingMyCash, canReportMissingCash, getSellerEta, myActiveItems, myStatusOf } from "./sellerOrderUtils";

interface SellerOrderRowProps {
    order: ISellerOrder;
    onView: (order: ISellerOrder) => void;
    onShip: (order: ISellerOrder) => void;
    onChangeEta: (order: ISellerOrder) => void;
    onCashReceived: (order: ISellerOrder) => void;
    onCashNotReceived: (order: ISellerOrder) => void;
    isConfirmingCash: boolean;
    isReporting: boolean;
}

/* one row of the seller orders table */
export default function SellerOrderRow({
    order,
    onView,
    onShip,
    onChangeEta,
    onCashReceived,
    onCashNotReceived,
    isConfirmingCash,
    isReporting,
}: SellerOrderRowProps) {
    const buyer = typeof order.user === "object" ? order.user : null;
    const firstItem = order.items[0];
    const firstProduct = firstItem && typeof firstItem.productId === "object" ? firstItem.productId : null;
    const extraCount = order.items.length - 1;
    const shortId = order._id.slice(-6).toUpperCase();

    return (
        <tr className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
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
                <Badge tone={STATUS_TONE[myStatusOf(order)] ?? "neutral"} label={myStatusOf(order)} />
                {order.paymentMethod === "cash" && myStatusOf(order) !== "cancelled" && (
                    <p className={`text-[11px] font-semibold mt-1 whitespace-nowrap ${myActiveItems(order).every((i) => i.cashCollectedAt)
                        ? "text-[var(--success-500)]"
                        : "text-[var(--warning-500)]"}`}>
                        {myActiveItems(order).every((i) => i.cashCollectedAt)
                            ? "💵 Cash received"
                            : "💵 Cash on delivery — paid to you"}
                    </p>
                )}
                {order.cashDispute?.reportedAt && myStatusOf(order) !== "cancelled" && (
                    <p className="text-[11px] font-semibold mt-1 whitespace-nowrap text-[var(--destructive)]">
                        ⚠ Cash reported missing — admin reviewing
                    </p>
                )}
                {awaitingMyCash(order) && myActiveItems(order).some((i) => i.buyerConfirmedAt) && !order.cashDispute?.reportedAt && (
                    <p className="text-[11px] mt-1 whitespace-nowrap text-[var(--foreground-muted)]">
                        Buyer confirmed receipt
                    </p>
                )}
                {getSellerEta(order) && ["processing", "shipped"].includes(myStatusOf(order)) && (
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
                        onClick={() => onView(order)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                        aria-label="View details"
                        title="View details"
                    >
                        <HiOutlineEye className="w-4 h-4" />
                    </button>
                    {order.status === "processing" && myStatusOf(order) === "processing" && order.myFulfillmentStatus !== "shipped" && (
                        <button
                            type="button"
                            onClick={() => onShip(order)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--primary-500)]/30 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10 transition-colors flex items-center gap-1.5"
                        >
                            <HiOutlineTruck className="w-4 h-4" />
                            Ship
                        </button>
                    )}
                    {awaitingMyCash(order) && (
                        <button
                            type="button"
                            onClick={() => onCashReceived(order)}
                            disabled={isConfirmingCash}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/40 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                        >
                            <HiOutlineBanknotes className="w-4 h-4" />
                            {isConfirmingCash ? "Saving..." : "Cash received"}
                        </button>
                    )}
                    {canReportMissingCash(order) && (
                        <button
                            type="button"
                            onClick={() => onCashNotReceived(order)}
                            disabled={isReporting}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {isReporting ? "Saving..." : "Not received"}
                        </button>
                    )}
                    {order.myFulfillmentStatus !== "pending" && ["processing", "shipped"].includes(myStatusOf(order)) && (
                        <button
                            type="button"
                            onClick={() => onChangeEta(order)}
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
}
