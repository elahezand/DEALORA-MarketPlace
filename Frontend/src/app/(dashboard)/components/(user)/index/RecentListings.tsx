"use client";

import { ListingProps } from "@/types/Listings";
import { HiOutlineTag, HiOutlineEye } from "react-icons/hi2";
import AdminTableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";

interface RecentListingsProps {
  initialData?: ListingProps[];
}

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  active: "success",
  accepted: "success",
  inactive: "neutral",
  draft: "warning",
  pending: "warning",
  rejected: "destructive",
};

export default function RecentListings({ initialData = [] }: RecentListingsProps) {
  return (
    <AdminTableCard
      header={
        <WidgetHeader
          icon={HiOutlineTag}
          title="My Listings"
          showViewAll={true}
          href="/dashboard/listings"
        />
      }
      isLoading={false}
      isError={false}
      isEmpty={initialData.length === 0}
      emptyTitle="No listings yet"
      emptyMessage="Listings you create will show up here"
    >
      <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
        <tr>
          <Th>Listing</Th>
          <Th>Condition</Th>
          <Th>Status</Th>
          <Th align="right">Price</Th>
        </tr>
      </thead>
      <tbody>
        {initialData.map((listing) => (
          <tr
            key={listing._id}
            className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cat-icon-blue">
                  <HiOutlineTag className="w-4 h-4 text-[var(--primary-400)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">
                    {listing.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-subtle)]">
                    <HiOutlineEye className="w-3 h-3" />
                    <span>{listing.metrics?.views ?? 0} views</span>
                    {listing.shortIdentifier && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-[var(--border-strong)]" />
                        <span className="font-mono opacity-60">#{listing.shortIdentifier}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <Badge
                tone={listing.condition === "new" ? "success" : "warning"}
                label={listing.condition === "new" ? "New" : "Used"}
              />
            </td>
            <td className="px-6 py-4">
              <Badge tone={STATUS_TONE[listing.status] ?? "neutral"} label={listing.status} />
            </td>
            <td className="px-6 py-4 text-right">
              <span className="text-sm font-black text-[var(--foreground)]">
                ${listing.price?.toLocaleString()}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTableCard>
  );
}