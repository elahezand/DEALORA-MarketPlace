"use client";
import { useState } from "react";
import { InfiniteData } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { HiOutlineCube, HiOutlinePlus } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet, useGet } from "@/utils/hooks/useReactQueryHooks";
import { ListingProps, PublicListingsResponse } from "@/types/Listings";
import { QueryParams } from "@/types/api/ErrorTypes";
import { CategoriesTypeResponse } from "@/types/Category";
import AdminFilters from "../shared/AdminFilters";
import { getUrl } from "@/utils/helper";
import { getListingPrice } from "@/utils/price";
import TableCard from "../../shared/table/TableCard";
import ListingReviewModal from "../shared/ListingReviewModal";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import {
  PRODUCTS_QUERY_KEY,
  ProductInput,
  useChangeProductStatus,
  useDeleteProduct,
} from "@/services/Products/useProductMutations";

type ProductStatus = ProductInput["status"] | "deleted";
type StatusTab = ProductStatus | "all";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
];

const STATUS_TONE: Record<ProductStatus, "success" | "info" | "warning" | "destructive"> = {
  active: "success",
  draft: "info",
  inactive: "warning",
  deleted: "destructive",
};

interface ProductsPageProps {
  initialData?: InfiniteData<PublicListingsResponse>;
}

export default function ProductsPage({ initialData }: ProductsPageProps) {
  const [status, setStatus] = useState<StatusTab | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueryParams>({});
  const { data: categoriesRes } = useGet<CategoriesTypeResponse>("/categories");

  const params: QueryParams = { listingType: "store_product", status, limit: 20, ...filters };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteGet<PublicListingsResponse>("/listings/admin", params, {
      queryKey: [PRODUCTS_QUERY_KEY, status, JSON.stringify(filters)],
      initialData: status === "all" && Object.keys(filters).length === 0 ? initialData : undefined,
    });

  const products: ListingProps[] = (
    data?.pages?.flatMap((page: PublicListingsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: changeStatus } = useChangeProductStatus();
  const { mutate: deleteProduct } = useDeleteProduct();

  const setProductStatus = (id: string, next: ProductInput["status"]) => {
    setBusyId(id);
    changeStatus({ id, status: next }, { onSettled: () => setBusyId(null) });
  };

  const STATUS_ACTIONS: Record<ProductInput["status"], { to: ProductInput["status"]; label: string; tone: string }[]> = {
    active: [
      { to: "inactive", label: "Deactivate", tone: "warning" },
      { to: "draft", label: "Move to draft", tone: "info" },
    ],
    inactive: [
      { to: "active", label: "Activate", tone: "success" },
      { to: "draft", label: "Move to draft", tone: "info" },
    ],
    draft: [{ to: "active", label: "Publish", tone: "success" }],
  };

  const TONE_BUTTON: Record<string, string> = {
    neutral: "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-soft)]",
    success: "border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)]",
    warning: "border-[var(--warning-500)]/30 text-[var(--warning-500)] hover:bg-[var(--warning-bg)]",
    info: "border-[var(--primary-500)]/30 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10",
    destructive: "border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)]",
  };

  const confirmDelete = (product: ListingProps) => {
    toast.warning(`Delete "${product.title}"?`, {
      description: "The product will be hidden from the site.",
      action: {
        label: "Delete",
        onClick: () => {
          setBusyId(product._id);
          deleteProduct(product._id, { onSettled: () => setBusyId(null) });
        },
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="menu-section-title mb-1">Admin</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Products</h1>
        </div>
        <Link
          href="/dashboard/admin/products/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--primary-500)] text-white text-sm font-bold hover:bg-[var(--primary-600)]"
        >
          <HiOutlinePlus /> Add product
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

      <AdminFilters
        value={filters}
        onChange={setFilters}
        showCategory
        categories={(categoriesRes?.data ?? []).map((c) => ({ _id: c._id, title: c.title }))}
        showSearch
        searchPlaceholder="Search by title..."
      />

      <TableCard
        header={<WidgetHeader icon={HiOutlineCube} title={`${STATUS_TABS.find((t) => t.value === status)?.label} Products`} href="/dashboard/admin/products" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={products.length === 0}
        errorMessage="Error fetching products"
        emptyTitle="No products"
        emptyMessage={status === "all" ? "No products yet — add your first one" : `No ${status} products`}
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Product</Th>
            <Th>Variants</Th>
            <Th>Stock</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const busy = busyId === product._id;
            const productStatus = product.status as ProductStatus;
            const totalStock = (product.variants ?? []).reduce((sum, v) => sum + (v.stock || 0), 0);

            return (
              <tr key={product._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      src={getUrl(product.images?.[0])}
                      alt={product.title}
                      fallback={product.title.slice(0, 2).toUpperCase()}
                      shape="square"
                    />
                    <button
                      type="button"
                      onClick={() => setReviewId(product._id)}
                      className="font-bold text-sm text-[var(--foreground)] hover:text-[var(--primary-500)] truncate max-w-[260px] text-left"
                    >
                      {product.title}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">{product.variants?.length ?? 0}</td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">{totalStock}</td>
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">From ${getListingPrice(product).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge tone={STATUS_TONE[productStatus] ?? "neutral"} label={product.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {productStatus === "deleted" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setProductStatus(product._id, "draft")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40 ${TONE_BUTTON.info}`}
                      >
                        Restore as draft
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setReviewId(product._id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${TONE_BUTTON.neutral}`}
                        >
                          View
                        </button>
                        <Link
                          href={`/dashboard/admin/products/${product._id}`}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${TONE_BUTTON.neutral}`}
                        >
                          Edit
                        </Link>
                        {(STATUS_ACTIONS[productStatus as ProductInput["status"]] ?? []).map((action) => (
                          <button
                            key={action.to}
                            type="button"
                            disabled={busy}
                            onClick={() => setProductStatus(product._id, action.to)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40 ${TONE_BUTTON[action.tone]}`}
                          >
                            {action.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => confirmDelete(product)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40 ${TONE_BUTTON.destructive}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      <ListingReviewModal
        listingId={reviewId}
        onClose={() => setReviewId(null)}
        renderActions={(product) => (
          <>
            {(STATUS_ACTIONS[product.status as ProductInput["status"]] ?? []).map((action) => (
              <button
                key={action.to}
                type="button"
                onClick={() => {
                  setProductStatus(product._id, action.to);
                  setReviewId(null);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg border ${TONE_BUTTON[action.tone]}`}
              >
                {action.label}
              </button>
            ))}
            <Link
              href={`/dashboard/admin/products/${product._id}`}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]"
            >
              Edit product
            </Link>
          </>
        )}
      />

      {hasNextPage && (
        <div className="flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] disabled:opacity-50"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight className={isFetchingNextPage ? "animate-spin" : ""} />
          </button>
        </div>
      )}
    </div>
  );
}