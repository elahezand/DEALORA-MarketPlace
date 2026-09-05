"use client";
import { useState } from "react";
import Link from "next/link";
import { HiOutlineDocumentCheck } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ListingProps, PublicListingsResponse } from "@/types/Listings";
import { QueryParams } from "@/types/api/ErrorTypes";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { toast } from "sonner";
import { useUpdateListingStatus } from "@/services/Listings/useUpdateListingStatus";
import { getUrl } from "@/utils/helper"


type ListingStatus = ListingProps["status"];

const STATUS_TABS: { value: ListingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "active", label: "Active" },
];

const STATUS_TONE: Record<
  ListingStatus,
  "success" | "warning" | "destructive" | "neutral" | "info"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  deleted: "destructive",
  active: "success",
  inactive: "neutral",
  draft: "neutral",
};

interface ListingsModerationClientProps {
  initialData?: InfiniteData<PublicListingsResponse>;
}

export default function ListingsModerationClient({
  initialData,
}: ListingsModerationClientProps) {
  const [status, setStatus] = useState<ListingStatus>("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const endpoint = "/listings/admin";
  const params: QueryParams = { status, limit: 20 };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<PublicListingsResponse>(endpoint, params, { initialData });

  const listings: ListingProps[] = (
    data?.pages?.flatMap((page: PublicListingsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  //change status
  const { mutate: updateStatus } = useUpdateListingStatus(() =>
    setActioningId(null)
  );

  function handleStatusChange(
    id: string,
    newStatus: "accepted" | "rejected"
  ) {
    const statusLabel = newStatus === "accepted" ? "accept" : "reject";

    toast.warning(`Are you sure you want to ${statusLabel} this listing?`, {
      description: "This action will change the listing status.",

      action: {
        label: "Confirm",
        onClick: () => {
          setActioningId(id);
          updateStatus(
            { id, status: newStatus },
            {
              onSettled: () => setActioningId(null),
            }
          );
        },
      },

      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  }


  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Listing Moderation
        </h1>
      </div>

      {/* Status filter tabs */}
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
        header={
          <WidgetHeader
            icon={HiOutlineDocumentCheck}
            title={`${STATUS_TABS.find((t) => t.value === status)?.label} Listings`}
            href="/dashboard/admin/listings"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={listings.length === 0}
        errorMessage="Error fetching listings"
        emptyTitle="Nothing here"
        emptyMessage={`No ${status} listings right now`}
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Listing</Th>
            <Th>Seller</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => {
            const src = getUrl(listing.images?.[0])
            const busy = actioningId === listing._id;
            const sellerName =
              listing.listingType === "store_product"
                ? listing.store?.name
                : listing.user?.name;

            return (
              <tr
                key={listing._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      src={src}
                      alt={listing.title}
                      fallback={(listing.title || "—").slice(0, 2).toUpperCase()}
                      shape="square"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${listing._id}`}
                        className="font-bold text-sm text-[var(--foreground)] hover:text-[var(--primary-500)] truncate block"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-[11px] text-[var(--foreground-subtle)]">
                        {sellerName || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {listing.user?.phone || "—"}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  ${listing.price?.toLocaleString() ?? 0}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={STATUS_TONE[listing.status] ?? "neutral"}
                    label={listing.status}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy || listing.status === "accepted"}
                      onClick={() => handleStatusChange(listing._id, "accepted")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors disabled:opacity-40"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy || listing.status === "rejected"}
                      onClick={() => handleStatusChange(listing._id, "rejected")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                    >
                      Reject
                    </button>
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
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""
                }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}