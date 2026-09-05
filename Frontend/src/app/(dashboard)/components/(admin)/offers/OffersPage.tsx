"use client";

import { useState } from "react";
import { HiOutlineTag } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useApproveOffer } from "@/services/Offer/useApproveOffer";
import { OfferStatus, Offer, OffersResponse } from "@/types/Offer";
import { QueryParams } from "@/types/api/ErrorTypes";

const STATUS_TABS: { value: OfferStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<
  OfferStatus,
  "success" | "warning" | "destructive"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
};

const ENDPOINT = "/offers";

interface OffersClientProps {
  initialData?: InfiniteData<OffersResponse>;
}

export default function OffersClient({ initialData }: OffersClientProps) {
  const [status, setStatus] = useState<OfferStatus | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<Offer | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const params: QueryParams = status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<OffersResponse>(ENDPOINT, params, { initialData });

  const offers: Offer[] = (
    data?.pages?.flatMap((page: OffersResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: approve } = useApproveOffer(() => {
    setRejectTarget(null);
    setAdminComment("");
  });

  function handleAccept(o: Offer) {
    setActioningId(o._id);
    approve(
      { offerId: o._id, status: "accepted" },
      { onSettled: () => setActioningId(null) }
    );
  }

  function openReject(o: Offer) {
    setRejectTarget(o);
    setAdminComment("");
  }

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;
    setActioningId(rejectTarget._id);
    approve(
      {
        offerId: rejectTarget._id,
        status: "rejected",
        adminComment: adminComment.trim() || undefined,
      },
      { onSettled: () => setActioningId(null) }
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Seller Offers
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${
              status === tab.value
                ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineTag}
            title="Offers to Store Products"
            href="/dashboard/admin/offers"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={offers.length === 0}
        errorMessage="Error fetching offers"
        emptyTitle="No offers"
        emptyMessage="Nothing to review right now"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Product</Th>
            <Th>Store / Seller</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => {
            const product = typeof o.product === "object" ? o.product : null;
            const store = typeof o.store === "object" ? o.store : null;
            const seller = typeof o.seller === "object" ? o.seller : null;
            const busy = actioningId === o._id;

            return (
              <tr
                key={o._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      src={product?.images?.[0]}
                      alt={product?.title ?? "product"}
                      fallback={(product?.title ?? "?").slice(0, 2).toUpperCase()}
                      shape="square"
                    />
                    <p className="font-bold text-sm text-[var(--foreground)] truncate max-w-[160px]">
                      {product?.title || "—"}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[var(--foreground)]">
                    {store?.name || "—"}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {seller?.username || seller?.phone || ""}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  ${o.price?.toLocaleString() ?? 0}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {o.stock}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={STATUS_TONE[o.status] ?? "warning"}
                    label={o.status}
                  />
                </td>
                <td className="px-6 py-4">
                  {o.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAccept(o)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors disabled:opacity-40"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openReject(o)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-right text-[var(--foreground-subtle)] truncate max-w-[160px]">
                      {o.adminComment || "—"}
                    </p>
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
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      )}

      <AdminFormModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Offer"
        icon={HiOutlineTag}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="reject-offer-form"
              className="btn-primary !w-auto px-5 h-9 text-xs"
            >
              Reject
            </button>
          </>
        }
      >
        <form
          id="reject-offer-form"
          onSubmit={submitReject}
          className="flex flex-col gap-4"
        >
          <FormField label="Comment for the seller (optional)">
            <textarea
              className={textareaClass}
              rows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Why is this offer being rejected?"
            />
          </FormField>
        </form>
      </AdminFormModal>
    </div>
  );
}