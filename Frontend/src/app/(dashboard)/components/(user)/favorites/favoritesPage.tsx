"use client";

import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HiChevronRight } from "react-icons/hi";
import { HiOutlineHeart, HiOutlineEye, HiOutlineTrash } from "react-icons/hi2";
import qs from "qs";
import { getUrl } from "@/utils/helper"
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useRemoveFavorite } from "@/services/Favorites/favorites";
import FavoritesTypeResponse from "@/types/favorites";
import { IPagination } from "@/types/common";
import { QueryParams } from "@/types/api/ErrorTypes";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge, ViewAction } from "../../shared/table/TableParts";

type FavoriteItem = FavoritesTypeResponse["data"][number];

interface InfiniteFavoritesSectionProps {
  initialData: FavoriteItem[];
  initialPagination?: IPagination | null;
  queryString?: string;
}

const STATUS_TONE: Record<string, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  sold: "destructive",
  inactive: "destructive",
};

export default function InfiniteFavoritesSection({
  initialData,
  initialPagination,
  queryString = "",
}: InfiniteFavoritesSectionProps) {
  const parsedParams = qs.parse(queryString) as QueryParams;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<FavoritesTypeResponse>("/wishList/my", parsedParams, {
    initialData: {
      pages: [{ data: initialData, pagination: initialPagination ?? undefined }],
      pageParams: [null],
    },
  });

  const { mutate: deleteFavorite } = useRemoveFavorite();

  const favorites = (
    data?.pages.flatMap((page: FavoritesTypeResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const handleRemove = (productId: string) => {
    if (!productId) return;
    toast.warning("Remove this from your favorites?", {
      description: "You can always add it back later.",
      action: {
        label: "Remove",
        onClick: () => deleteFavorite({ productId }),
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  };

  return (
    <div className="w-full flex flex-col items-center bg-transparent gap-6">
      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineHeart}
            title="My Favorites"
            href="/dashboard/favorites"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={favorites.length === 0}
        errorMessage="Error fetching favorites"
        emptyTitle="No favorites yet"
        emptyMessage="Items you favorite will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Title</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th align="center">Views</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {favorites.map((favorite: FavoriteItem) => {
            if (!favorite) return null;
            const src = getUrl(favorite.product?.images?.[0])
            const product = favorite.product;
            const statusKey = product?.status?.toLowerCase() || "inactive";
            const tone = STATUS_TONE[statusKey] ?? "destructive";
            const label =
              statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

            return (
              <tr
                key={favorite._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                {/* Title & Thumbnail */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--background-soft)] rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                      <img
                        src={src || "/placeholder.png"}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--foreground)] truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        #{product.shortIdentifier}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  ${product.price?.toLocaleString()}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  <Badge tone={tone} label={label} />
                </td>

                {/* Views */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <HiOutlineEye className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {product.metrics?.views ?? 0}
                    </p>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ViewAction href={`/listings/${product.slug || product._id}`} />
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="p-2 hover:bg-[var(--destructive-bg)] rounded-lg transition-colors group"
                      title="Remove from favorites"
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
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : "group-hover:translate-x-0.5"
                }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}