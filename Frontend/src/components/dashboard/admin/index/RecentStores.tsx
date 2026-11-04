"use client";

import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { useGetStores } from "@/services/Store/useGetStores";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, ViewAction, Badge } from "../../shared/table/TableParts";

export default function RecentStores() {
  const { stores, isLoading, isError } = useGetStores(5);

  return (
    <TableCard
      header={<WidgetHeader icon={HiOutlineBuildingStorefront}
        showViewAll={true}
        title="Recent Stores" href="/dashboard/admin/stores" />}
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
          <Th>Status</Th>
          <Th align="right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {stores.map((store) => (
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
                <p className="font-bold text-sm text-[var(--foreground)] truncate">
                  {store.name}
                </p>
              </div>
            </td>
            <td className="px-6 py-4">
              <Badge
                tone={store.isVerified ? "success" : "warning"}
                label={store.isVerified ? "Verified" : "Pending"}
              />
            </td>
            <td className="px-6 py-4 text-right">
              <ViewAction href="/dashboard/admin/stores" />
            </td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  );
}