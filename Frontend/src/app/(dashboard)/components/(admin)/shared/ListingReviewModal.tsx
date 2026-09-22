"use client";

import { Fragment, useState, type ReactNode } from "react";
import { HiOutlineEye } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ListingProps, ListingTypeResponse } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { getVariantLabel } from "@/utils/price";
import { AdminFormModal } from "./AdminFormModal";
import { Badge } from "../../shared/table/TableParts";

const STATUS_TONE: Record<ListingProps["status"], "success" | "warning" | "destructive" | "info"> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  deleted: "destructive",
  active: "success",
  inactive: "warning",
  draft: "info",
};

const money = (n?: number) => `$${(n ?? 0).toLocaleString()}`;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs font-semibold text-[var(--foreground-muted)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--foreground)] text-right break-words">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--foreground-subtle)]">{title}</p>
      {children}
    </div>
  );
}

interface ListingReviewModalProps {
  listingId: string | null;
  onClose: () => void;
  /** decision buttons of the page that opened it (accept / reject, activate / draft ...) */
  renderActions?: (listing: ListingProps) => ReactNode;
}

export default function ListingReviewModal({ listingId, onClose, renderActions }: ListingReviewModalProps) {
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, isError } = useGet<ListingTypeResponse>(
    `/listings/admin/${listingId}/preview`,
    undefined,
    { queryKey: ["admin-listing-review", listingId], enabled: !!listingId }
  );
  const listing = data?.data;
  const isProduct = listing?.listingType === "store_product";

  const handleClose = () => {
    setActiveImage(0);
    onClose();
  };

  return (
    <AdminFormModal
      isOpen={!!listingId}
      onClose={handleClose}
      title={isProduct ? "Product details" : "Ad details"}
      icon={HiOutlineEye}
      maxWidth="max-w-[860px]"
      footer={listing && renderActions ? renderActions(listing) : undefined}
    >
      {isLoading && <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>}
      {isError && <p className="text-sm text-[var(--destructive)]">Could not load this listing.</p>}

      {listing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="aspect-square w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background-soft)] flex items-center justify-center">
              {listing.images?.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getUrl(listing.images[activeImage]) ?? ""}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-[var(--foreground-subtle)]">No images</span>
              )}
            </div>
            {listing.images?.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {listing.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i === activeImage ? "border-[var(--primary-500)]" : "border-[var(--border)]"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getUrl(img) ?? ""} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={STATUS_TONE[listing.status as ListingProps["status"]] ?? "neutral"} label={listing.status} />
                <Badge tone="neutral" label={isProduct ? "Store product" : "User ad"} />
              </div>
              <h2 className="text-lg font-black text-[var(--foreground)] leading-snug">{listing.title}</h2>
              <p className="text-2xl font-black text-[var(--primary-600)]">
                {isProduct ? `From ${money(listing.minPrice ?? 0)}` : money(listing.price)}
              </p>
            </div>

            <Section title="Details">
              <div>
                <Row label="Category">{listing.categoryPath?.map((c) => c.title).join(" › ") || "—"}</Row>
                <Row label="Condition">{listing.condition}</Row>
                {!isProduct && listing.location && (
                  <Row label="Location">{`${listing.location.city}, ${listing.location.state}`}</Row>
                )}
                {!isProduct && listing.owner && (
                  <Row label="Posted by">
                    {listing.owner.name || "—"}
                    {listing.owner.phone ? ` · ${listing.owner.phone}` : ""}
                  </Row>
                )}
                <Row label="Shipping">
                  {listing.shipping?.type ?? "standard"}
                  {listing.shipping?.cost ? ` · ${money(listing.shipping.cost)}` : ""}
                </Row>
                <Row label="Created">{new Date(listing.createdAt).toLocaleString()}</Row>
              </div>
            </Section>

            {listing.specs && Object.keys(listing.specs).length > 0 && (
              <Section title="Specifications">
                <div>
                  {Object.entries(listing.specs).map(([key, value]) => (
                    <Fragment key={key}>
                      <Row label={key}>{String(value)}</Row>
                    </Fragment>
                  ))}
                </div>
              </Section>
            )}

            {listing.tags && listing.tags.length > 0 && (
              <Section title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg bg-[var(--background-soft)] border border-[var(--border)]">
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {isProduct && (
            <div className="md:col-span-2">
              <Section title={`Variants (${listing.variants?.length ?? 0})`}>
                <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--background-soft)] text-xs text-[var(--foreground-muted)]">
                      <tr>
                        <th className="text-left px-3 py-2">Variant</th>
                        <th className="text-left px-3 py-2">SKU</th>
                        <th className="text-right px-3 py-2">Price</th>
                        <th className="text-right px-3 py-2">Discount</th>
                        <th className="text-right px-3 py-2">Final</th>
                        <th className="text-right px-3 py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(listing.variants ?? []).map((v) => (
                        <tr key={v._id} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2">{getVariantLabel(v) || "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                          <td className="px-3 py-2 text-right">{money(v.price)}</td>
                          <td className="px-3 py-2 text-right">{v.discount ? `${v.discount}%` : "—"}</td>
                          <td className="px-3 py-2 text-right font-bold">{money(v.finalPrice)}</td>
                          <td className={`px-3 py-2 text-right ${v.stock === 0 ? "text-[var(--destructive)] font-bold" : ""}`}>
                            {v.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          )}

          <div className="md:col-span-2">
            <Section title="Description">
              <p className="text-sm text-[var(--foreground)] whitespace-pre-line leading-relaxed">{listing.description}</p>
            </Section>
          </div>
        </div>
      )}
    </AdminFormModal>
  );
}