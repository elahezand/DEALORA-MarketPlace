"use client";
import ListingsSection from "../shared/listingSection";
import { TfiFaceSad } from "react-icons/tfi";
import { Skeleton } from "@heroui/react";
import { ListingProps } from "@/types/Listings";


const ItemsList = ({ data }: { data: ListingProps[] }) => {

  if (!data) {
    return (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4 p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--card)] h-[232px]">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full text-center h-[400px] flex flex-col gap-4 items-center justify-center text-[var(--foreground-muted)]">
        <TfiFaceSad size={64} className="text-[var(--foreground-subtle)] opacity-70" />
        <p className="text-lg font-medium text-[var(--destructive)]">No item exists</p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
      < ListingsSection listings={data ? data : []} />
    </div>
  );
};

export default ItemsList;