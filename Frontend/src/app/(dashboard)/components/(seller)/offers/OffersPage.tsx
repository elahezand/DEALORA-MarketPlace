"use client";

import { useState } from "react";
import { HiOutlineTag, HiOutlinePlus } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../../(admin)/shared/AdminFormModal";
import { useUpdateOffer } from "@/services/Offer/useUpdateOffer";
import { useDeleteOffer } from "@/services/Offer/useDeleteOffer";
import Link from "next/link";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { OfferStatus, Offer, OffersResponse } from "@/types/Offer";
import { getUrl } from "@/utils/helper";
import { findVariant, getVariantLabel } from "@/utils/price";
import { QueryParams } from "@/types/api/ErrorTypes";
import { toast } from "sonner";

const STATUS_TABS: { value: OfferStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<OfferStatus, "success" | "warning" | "destructive"> = {
    pending: "warning",
    accepted: "success",
    rejected: "destructive",
};

interface MyOffersPageProps {
    initialData?: InfiniteData<OffersResponse>;
}

const ENDPOINT = "/offers/me"

export default function OffersPage({ initialData }: MyOffersPageProps) {
    const [status, setStatus] = useState<OfferStatus | "all">("pending");
    const [editTarget, setEditTarget] = useState<Offer | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
    const [priceInput, setPriceInput] = useState("");
    const [stockInput, setStockInput] = useState("");
    const [discountInput, setDiscountInput] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");
    const [actioningId, setActioningId] = useState<string | null>(null);

    const params: QueryParams = status === "all" ? { limit: 20 } : { limit: 20, status };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteGet<OffersResponse>(
        ENDPOINT,
        params,
        { queryKey: ["offers-me", status], initialData: status === "pending" ? initialData : undefined }
    );

    const offers: Offer[] = (
        data?.pages?.flatMap((page: OffersResponse) => page?.data ?? []) || []
    ).filter(Boolean);

    const { mutate: updateOffer, isPending: isSaving } = useUpdateOffer(() => {
        closeEdit();
    });
    const { mutate: deleteOffer, isPending: isDeleting } = useDeleteOffer();

    function openEdit(offer: Offer) {
        setEditTarget(offer);
        setPriceInput(String(offer.price ?? ""));
        setStockInput(String(offer.stock ?? ""));
        setDiscountInput(String(offer.discount ?? 0));
        setDescriptionInput("");
    }

    function closeEdit() {
        setEditTarget(null);
        setPriceInput("");
        setStockInput("");
        setDiscountInput("");
        setDescriptionInput("");
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;

        const price = priceInput.trim() ? Number(priceInput) : undefined;
        const stock = stockInput.trim() ? Number(stockInput) : undefined;
        const discount = discountInput.trim() ? Number(discountInput) : undefined;
        const description = descriptionInput.trim() || undefined;

        if (discount !== undefined && (Number.isNaN(discount) || discount < 0 || discount > 100)) {
            toast.error("Discount must be between 0 and 100");
            return;
        }

        if (price === undefined && stock === undefined && discount === undefined && description === undefined) {
            toast.error("Change at least one field before saving");
            return;
        }

        updateOffer({ offerId: editTarget._id, price, stock, discount, description });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        setActioningId(deleteTarget._id);
        deleteOffer(
            { offerId: deleteTarget._id },
            { onSettled: () => setActioningId(null), onSuccess: () => setDeleteTarget(null) }
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="menu-section-title mb-1">Seller</p>
                    <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">My Offers</h1>
                </div>
                <Link
                    href="/dashboard/seller/offers/new"
                    className="btn-primary !w-auto px-5 h-10 text-sm gap-2 flex items-center"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    <span>Add New Offer</span>
                </Link>
            </div>

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

            <TableCard
                header={<WidgetHeader icon={HiOutlineTag} title="Offers on Store Products" href="/dashboard/seller/offers" />}
                isLoading={isLoading}
                isError={isError}
                isEmpty={offers.length === 0}
                errorMessage="Error fetching your offers"
                emptyTitle="No offers yet"
                emptyMessage="Offers you place on marketplace products will show up here"
            >
                <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
                    <tr>
                        <Th>Product</Th>
                        <Th>Price</Th>
                        <Th>Discount</Th>
                        <Th>Stock</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </tr>
                </thead>
                <tbody>
                    {offers.map((o) => {
                        const product = typeof o.productId === "object" ? o.productId : null;
                        const busy = actioningId === o._id;
                        const src = getUrl(product?.images?.[0])
                        return (
                            <tr key={o._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <EntityAvatar
                                            src={src}
                                            alt={product?.title ?? "product"}
                                            fallback={(product?.title ?? "?").slice(0, 2).toUpperCase()}
                                            shape="square"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-[var(--foreground)] truncate max-w-[220px]">
                                                {product?.title || "—"}
                                            </p>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[220px]">
                                                {getVariantLabel(findVariant(o.productId, o.variantId)) || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                                    {!!o.discount && o.discount > 0 && (
                                        <span className="block text-xs font-medium text-[var(--foreground-subtle)] line-through">
                                            ${o.price?.toLocaleString() ?? 0}
                                        </span>
                                    )}
                                    ${o.finalPrice.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                                    {o.discount ? `${o.discount}%` : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">{o.stock}</td>
                                <td className="px-6 py-4">
                                    <Badge tone={STATUS_TONE[o.status] ?? "warning"} label={o.status} />
                                </td>
                                <td className="px-6 py-4">
                                    {o.status === "rejected" ? (
                                        <p className="text-xs text-right text-[var(--foreground-subtle)] truncate max-w-[200px]">
                                            {o.adminComment || "No reason given"}
                                        </p>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(o)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            {o.status === "pending" && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => setDeleteTarget(o)}
                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
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

            {/* EDIT MODAL */}
            <AdminFormModal
                isOpen={!!editTarget}
                onClose={closeEdit}
                title="Edit Offer"
                icon={HiOutlineTag}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={closeEdit}
                            className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="edit-offer-form"
                            disabled={isSaving}
                            className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </>
                }
            >
                <form id="edit-offer-form" onSubmit={submitEdit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Price">
                            <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Stock (your own inventory)">
                            <input
                                type="number"
                                min={1}
                                className={inputClass}
                                value={stockInput}
                                onChange={(e) => setStockInput(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <FormField label="Discount % (0-100)">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            className={inputClass}
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                        />
                    </FormField>
                    {priceInput && (
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Final price after discount:{" "}
                            <span className="font-bold text-[var(--foreground)]">
                                ${(Number(priceInput) - (Number(priceInput) * (Number(discountInput) || 0)) / 100).toLocaleString()}
                            </span>
                        </p>
                    )}
                    <FormField label="Note (optional)">
                        <textarea
                            className={textareaClass}
                            rows={3}
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                            placeholder="e.g. shipping time, warranty terms"
                        />
                    </FormField>
                    <p className="text-xs text-[var(--foreground-muted)]">
                        Stock here is your own inventory for this offer — it's separate from the product's overall listing stock.
                    </p>
                </form>
            </AdminFormModal>

            {/* DELETE CONFIRM MODAL */}
            <AdminFormModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Offer"
                icon={HiOutlineTag}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="text-xs font-bold px-5 h-9 rounded-lg bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isDeleting ? "Deleting..." : "Delete Offer"}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-[var(--foreground)]">
                    Are you sure you want to delete this offer
                    {deleteTarget && typeof deleteTarget.productId === "object"
                        ? ` on "${deleteTarget.productId?.title}"`
                        : ""}
                    ? This can't be undone.
                </p>
            </AdminFormModal>
        </div>
    );
}