"use client";

import { useState } from "react";
import Link from "next/link";
import {
    HiOutlineDocumentCheck,
    HiChevronRight,
} from "react-icons/hi2";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import {
    ListingProps,
    PublicListingsResponse,
} from "@/types/Listings";
import { QueryParams } from "@/types/api/ErrorTypes";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import {
    Th,
    EntityAvatar,
    Badge,
} from "../../shared/table/TableParts";
import { toast } from "sonner";
import { useUpdateListingStatus } from "@/services/Listings/useUpdateListingStatus";
import { getUrl } from "@/utils/helper";
import { getListingPrice } from "@/utils/price";

const Endpoint = "/listings/admin";

type ListingStatus = ListingProps["status"];
type StatusTab = ListingStatus | "all";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "draft", label: "Draft" },
    { value: "deleted", label: "Deleted" },
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

interface ProductsModerationClientProps {
    initialData?: InfiniteData<PublicListingsResponse>;
}

export default function ProductsModerationClient({
    initialData,
}: ProductsModerationClientProps) {
    const [status, setStatus] = useState<StatusTab>("all");
    const [actioningId, setActioningId] = useState<string | null>(null);

    const params: QueryParams = {
        listingType: "store_product",
        status,
        limit: 20,
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteGet<PublicListingsResponse>(
        Endpoint,
        params,
        {
            queryKey: ["listings-moderation", status],
            initialData: status === "draft" ? initialData : undefined,
        }
    );

    const listings: ListingProps[] = (
        data?.pages?.flatMap(
            (page: PublicListingsResponse) => page?.data ?? []
        ) || []
    ).filter(Boolean);

    const { mutate: updateStatus } = useUpdateListingStatus(() =>
        setActioningId(null)
    );

    function handleStatusChange(
        id: string,
        newStatus: "active" | "inactive" | "deleted"
    ) {
        const statusLabel =
            newStatus === "active"
                ? "active"
                : newStatus === "inactive"
                    ? "inactive"
                    : "deleted";

        toast.warning(
            `Are you sure you want to set this listing to ${statusLabel}?`,
            {
                description:
                    "This action will change the listing status.",

                action: {
                    label: "Confirm",
                    onClick: () => {
                        setActioningId(id);

                        updateStatus(
                            {
                                id,
                                status: newStatus,
                            },
                            {
                                onSettled: () =>
                                    setActioningId(null),
                            }
                        );
                    },
                },

                cancel: {
                    label: "Cancel",
                    onClick: () => {},
                },
            }
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div>
                <p className="menu-section-title mb-1">
                    Admin
                </p>

                <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
                    Store Products
                </h1>
            </div>

            {/* Status filter tabs */}
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
                        icon={HiOutlineDocumentCheck}
                        title={`${
                            STATUS_TABS.find(
                                (t) => t.value === status
                            )?.label
                        } Products`}
                        href="/dashboard/admin/listings"
                    />
                }
                isLoading={isLoading}
                isError={isError}
                isEmpty={listings.length === 0}
                errorMessage="Error fetching listings"
                emptyTitle="Nothing here"
                emptyMessage={
                    status === "all"
                        ? "No products yet"
                        : `No ${status} products right now`
                }
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
                        const src = getUrl(
                            listing.images?.[0]
                        );

                        const busy =
                            actioningId === listing._id;

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
                                            fallback={(
                                                listing.title || "—"
                                            )
                                                .slice(0, 2)
                                                .toUpperCase()}
                                            shape="square"
                                        />

                                        <div className="min-w-0">
                                            <Link
                                                href={`/posts/${listing._id}?preview=admin`}
                                                className="font-bold text-sm text-[var(--foreground)] hover:text-[var(--primary-500)] truncate block"
                                            >
                                                {listing.title}
                                            </Link>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                                    {listing.owner?.phone || "—"}
                                </td>

                                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                                    $
                                    {getListingPrice(
                                        listing
                                    ).toLocaleString()}
                                </td>

                                <td className="px-6 py-4">
                                    <Badge
                                        tone={
                                            STATUS_TONE[
                                                listing.status
                                            ] ?? "neutral"
                                        }
                                        label={listing.status}
                                    />
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Accept */}
                                        <button
                                            type="button"
                                            disabled={
                                                busy ||
                                                listing.status ===
                                                    "active" ||
                                                listing.status ===
                                                    "deleted"
                                            }
                                            onClick={() =>
                                                handleStatusChange(
                                                    listing._id,
                                                    "active"
                                                )
                                            }
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors disabled:opacity-40"
                                        >
                                            Active
                                        </button>

                                        {/* Inactive */}
                                        <button
                                            type="button"
                                            disabled={
                                                busy ||
                                                listing.status ===
                                                    "inactive" ||
                                                listing.status ===
                                                    "deleted"
                                            }
                                            onClick={() =>
                                                handleStatusChange(
                                                    listing._id,
                                                    "inactive"
                                                )
                                            }
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors disabled:opacity-40"
                                        >
                                            Deactivate
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            disabled={
                                                busy ||
                                                listing.status ===
                                                    "deleted"
                                            }
                                            onClick={() =>
                                                handleStatusChange(
                                                    listing._id,
                                                    "deleted"
                                                )
                                            }
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                                        >
                                            Delete
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
                        <span>
                            {isFetchingNextPage
                                ? "Loading..."
                                : "Load More"}
                        </span>

                        <HiChevronRight
                            className={`text-lg transition-transform duration-200 ${
                                isFetchingNextPage
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />
                    </button>
                </div>
            )}
        </div>
    );
}