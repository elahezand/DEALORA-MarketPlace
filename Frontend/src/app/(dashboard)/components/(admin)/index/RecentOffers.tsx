"use client";

import { HiOutlineTag } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { Offer, OfferStatus, OffersResponse } from "@/types/Offer";

const STATUS_TONE: Record<OfferStatus, "success" | "warning" | "destructive"> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
};

export default function RecentOffers() {
  const { data, isLoading, isError } = useGet<OffersResponse>("/offers", { limit: 5 });
  const offers: Offer[] = data?.data ?? [];

  return (
    <TableCard
      header={
        <WidgetHeader
          icon={HiOutlineTag}
          title="Recent Offers"
          showViewAll={true}
          href="/dashboard/admin/offers"
        />
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={offers.length === 0}
      errorMessage="Error fetching offers"
      emptyTitle="No offers yet"
      emptyMessage="Seller offers awaiting review will show up here"
    >
      <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
        <tr>
          <Th>Product</Th>
          <Th>Seller</Th>
          <Th>Price</Th>
          <Th>Status</Th>
          <Th>Date</Th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => {
          const product = typeof offer.product === "object" ? offer.product : null;
          const listing = typeof offer.listing === "object" ? offer.listing : null;
          const title = product?.title || listing?.title || "—";
          const image = product?.images?.[0] || listing?.images?.[0] || null;
          const seller = typeof offer.seller === "object" ? offer.seller : null;
          const tone = STATUS_TONE[offer.status] ?? "warning";
          const label = offer.status.charAt(0).toUpperCase() + offer.status.slice(1);

          return (
            <tr
              key={offer._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <EntityAvatar src={image} alt={title} fallback={title.charAt(0)} shape="square" />
                  <p className="text-sm font-bold text-[var(--foreground)] truncate max-w-[160px]">
                    {title}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                {seller?.username || seller?.phone || "—"}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                {new Intl.NumberFormat("en-US").format(offer.finalPrice ?? offer.price)} Toman
              </td>
              <td className="px-6 py-4">
                <Badge tone={tone} label={label} />
              </td>
              <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("en-US") : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableCard>
  );
}