"use client";

import { Badge, EntityAvatar } from "../../shared/table/TableParts";
import { ISellerOrder } from "@/types/Order";
import { getUrl } from "@/utils/helper";
import { STATUS_TONE, getTrackingCode, myStatusOf } from "./sellerOrderUtils";

/* body of the "order details" modal on the seller orders page */
export default function SellerOrderDetails({ order: viewTarget }: { order: ISellerOrder }) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge tone={STATUS_TONE[myStatusOf(viewTarget)] ?? "neutral"} label={myStatusOf(viewTarget)} />
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
    );
}
