"use client";

import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

type ListingType = "store_product" | "user_ad";

interface ListingTypeTabsProps {
  currentType: ListingType | string; 
}

export default function ListingTypeTabs({ currentType }: ListingTypeTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (type: ListingType) => {
    const params = new URLSearchParams(searchParams); 
    params.set("listingType", type);
    params.delete("page"); 
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div 
      role="tablist" 
      aria-label="Listing type selection"
      className="w-full bg-[var(--background-soft)] border border-[var(--border)] rounded-2xl p-1.5 flex gap-3 shadow-[var(--card-shadow-2)] relative"
    >
      
      {/* Official Stores Tab */}
      <button
        role="tab"
        aria-selected={currentType === "store_product"}
        onClick={() => handleTabChange("store_product")}
        className={clsx(
          "flex-1 py-3 px-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 group text-center relative overflow-hidden",
          currentType === "store_product"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 scale-[1.01]"
            : "text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        )}
      >
        <div className="flex items-center gap-2">
          <span 
            role="img" 
            aria-label="Store emoji"
            className={clsx(
              "text-xl transition-transform duration-300",
              currentType === "store_product" ? "scale-110" : "group-hover:scale-110"
            )}
          >
            🏪
          </span>
          <span className="text-sm font-bold tracking-wide">Official Stores</span>
        </div>
        <span className={clsx(
          "text-[10px] font-medium tracking-tight transition-colors",
          currentType === "store_product" ? "text-blue-100/90" : "text-gray-400"
        )}>
          Verified businesses & brand warranty
        </span>
      </button>

      {/* Classified Ads Tab */}
      <button
        role="tab"
        aria-selected={currentType === "user_ad"}
        onClick={() => handleTabChange("user_ad")}
        className={clsx(
          "flex-1 py-3 px-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 group text-center relative overflow-hidden",
          currentType === "user_ad"
            ? "bg-[var(--destructive)] text-white shadow-lg shadow-red-500/20 scale-[1.01]"
            : "text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        )}
      >
        <div className="flex items-center gap-2">
          <span 
            role="img" 
            aria-label="Handshake emoji"
            className={clsx(
              "text-xl transition-transform duration-300",
              currentType === "user_ad" ? "scale-110" : "group-hover:scale-110"
            )}
          >
            🤝
          </span>
          <span className="text-sm font-bold tracking-wide">Classified Ads</span>
        </div>
        <span className={clsx(
          "text-[10px] font-medium tracking-tight transition-colors",
          currentType === "user_ad" ? "text-white" : "text-gray-400"
        )}>
          Peer-to-peer deals & direct buying
        </span>
      </button>

    </div>
  );
}