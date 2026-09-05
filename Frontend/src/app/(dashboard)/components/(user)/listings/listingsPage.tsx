"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getUrl } from "@/utils/helper"
import { HiChevronRight } from "react-icons/hi";
import {
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineQueueList,
} from "react-icons/hi2";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useDeleteListing } from "@/services/Listings/useDeleteListing";
import { ListingProps } from "@/types/Listings";
import type MyListingsResponse from "@/types/Listings";
import { IPagination } from "@/types/common";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive"> = {
  active: "success",
  accepted: "success",
  pending: "warning",
  draft: "warning",
  inactive: "destructive",
  rejected: "destructive",
  deleted: "destructive",
};

const filterOptions = [
  { id: "all", label: "All Listings", status: null },
  { id: "active", label: "Active", status: ["active", "accepted"] },
  { id: "pending", label: "Pending Review", status: ["pending"] },
  { id: "draft", label: "Drafts", status: ["draft"] },
  { id: "inactive", label: "Inactive", status: ["inactive"] },
  { id: "rejected", label: "Rejected", status: ["rejected"] },
];

interface InfiniteListingsSectionProps {
  initialData: ListingProps[];
  initialPagination?: IPagination;
}

const EMPTY_PAGINATION: IPagination = { limit: 20, nextCursor: null, hasMore: false };

export default function ListingsPage({
  initialData,
  initialPagination,
}: InfiniteListingsSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<MyListingsResponse>("/listings/my", {}, {
    initialData: {
      pages: [{ success: true, data: { data: initialData, pagination: initialPagination ?? EMPTY_PAGINATION } }],
      pageParams: [null],
    },
  });

  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

const handleDelete = (id: string) => {
  toast.warning("Are you sure you want to delete this listing?", {
    description: "This action cannot be undone.",
    action: {
      label: "Delete",
      onClick: () => deleteListing({ id }),
    },
    cancel: {
      label: "Cancel",
      onClick: () => {},
    },
  });
};

  const allListings = (
    data?.pages.flatMap((page: MyListingsResponse) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const selectedFilterConfig = filterOptions.find(
    (f) => f.id === selectedFilter
  );

  const listings =
    selectedFilterConfig?.status === null
      ? allListings
      : allListings.filter((l) =>
          selectedFilterConfig?.status?.includes(l.status)
        );

  return (
    <div className="flex flex-col gap-8 pb-10 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Listings</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            My Listings
          </h1>
        </div>
        <Link
          href="/posts/new"
          className="btn-primary !w-auto px-5 h-10 text-sm gap-2 flex items-center"
        >
          <span>+</span>
          <span>New Listing</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
              selectedFilter === filter.id
                ? "bg-[var(--primary-500)] text-white shadow-lg"
                : "bg-[var(--background-soft)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--card-solid)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineQueueList}
            title="Listings Directory"
            href="/dashboard/listings"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={listings.length === 0}
        errorMessage="Error fetching listings"
        emptyTitle="No listings found"
        emptyMessage={
          selectedFilter === "all"
            ? "Create your first listing to get started"
            : `No listings match the "${selectedFilterConfig?.label}" filter`
        }
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Title</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th align="center">Views</Th>
            <Th align="center">Sold</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing: ListingProps, index: number) => {
            if (!listing) return null;
            const statusKey = listing.status?.toLowerCase() || "inactive";
            const tone = STATUS_TONE[statusKey] ?? "warning";
            const label =
              statusKey === "pending"
                ? "In Review"
                : statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

            return (
              <tr
                key={listing._id || index + 1}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                {/* Title & Image */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--background-soft)] rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                      <img
                        src={getUrl( listing.images?.[0])
                        || "/placeholder.png"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--foreground)] truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        #{listing.shortIdentifier}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  ${listing.price?.toLocaleString()}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <Badge tone={tone} label={label} />
                </td>

                {/* Views */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <HiOutlineEye className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {listing.metrics?.views ?? 0}
                    </p>
                  </div>
                </td>

                {/* Sold Count */}
                <td className="px-6 py-4 text-center">
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {listing.metrics?.sold ?? 0}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/listings/${listing._id}`}
                      className="p-2 hover:bg-[var(--background-soft)] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(listing._id)}
                      disabled={isDeleting}
                      className="p-2 hover:bg-[var(--destructive-bg)] rounded-lg transition-colors group disabled:opacity-50"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--destructive)]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div className="mt-2 flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage
                  ? "animate-spin"
                  : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}