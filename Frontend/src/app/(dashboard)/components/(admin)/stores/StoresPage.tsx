"use client";

import { useState } from "react";
import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IStore } from "@/types/User";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { useVerifyStore } from "@/services/Store/useVerifyStore";

export interface AdminStoreRow extends Omit<IStore, "owner"> {
  owner: { _id: string; username?: string; phone?: string } | string;
}

const ENDPOINT = "/stores";

interface StoresClientProps {
  initialData?: any;
}

export default function StoresClient({ initialData }: StoresClientProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, { limit: 20 }, { initialData });

  const stores: AdminStoreRow[] = (
    data?.pages?.flatMap((page: any) => page?.stores?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: setVerified } = useVerifyStore();

  function handleVerifyToggle(store: AdminStoreRow) {
    setActioningId(store._id);
    setVerified(
      { id: store._id, isVerified: !store.isVerified },
      { onSettled: () => setActioningId(null) }
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Stores
        </h1>
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineBuildingStorefront}
            title="All Stores"
            href="/dashboard/admin/stores"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={stores.length === 0}
        errorMessage="Error fetching stores"
        emptyTitle="No stores yet"
        emptyMessage="New stores will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Store</Th>
            <Th>Owner</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => {
            const owner = typeof store.owner === "object" ? store.owner : null;
            const busy = actioningId === store._id;
            return (
              <tr
                key={store._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      src={store.logo}
                      alt={store.name}
                      fallback={store.name.slice(0, 2).toUpperCase()}
                      shape="square"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--foreground)] truncate">
                        {store.name}
                      </p>
                      {store.phone && (
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {store.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[var(--foreground)]">
                    {owner?.username || owner?.phone || "—"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={store.isVerified ? "success" : "warning"}
                    label={store.isVerified ? "Verified" : "Pending"}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVerifyToggle(store)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                      store.isVerified
                        ? "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--warning-bg)] hover:text-[var(--warning-500)] hover:border-[var(--warning-500)]/30"
                        : "border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)]"
                    }`}
                  >
                    {store.isVerified ? "Revoke" : "Verify"}
                  </button>
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
    </div>
  );
}