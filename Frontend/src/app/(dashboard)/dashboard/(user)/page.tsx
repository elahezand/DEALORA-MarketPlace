import Link from "next/link";
import Stats from "@/app/(dashboard)/components/(user)/index/Stats";
import Orders from "@/app/(dashboard)/components/(user)/index/RecentOrders";
import Listings from "@/app/(dashboard)/components/(user)/index/RecentListings";
import ProfileBanner from "@/app/(dashboard)/components/(user)/index/ProfileBanner";
import { OrdersResponse } from "@/types/Order";
import ListingsTypeResponse from "@/types/Listings";
import { useAuthServerData } from "@/utils/hooks/useServerData";

interface FavoritesCountResponse {
  count: number;
}

export default async function DashboardPage() {
  const [orders, listings, favoritesCount] = await Promise.all([
    useAuthServerData<OrdersResponse>("/orders/my"),
    useAuthServerData<ListingsTypeResponse>("/listings/my"),
    useAuthServerData<FavoritesCountResponse>("/wishList/count"),
  ]);

  const orderList = orders?.data?.data ?? [];
  const listingList = listings?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Welcome back</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            My Dashboard
          </h1>
        </div>
        <Link
          href="/posts/new"
          className="btn-primary !w-auto px-5 h-10 text-sm gap-2 flex items-center"
        >
          <span>+</span>
          <span>New Listing</span>
        </Link>
      </div>
      {/* Profile completion banner */}
      <ProfileBanner />
      <Stats
        ordersCount={orderList.length}
        ordersHasMore={!!orders?.data?.pagination?.hasMore}
        listingsCount={listingList.length}
        listingsHasMore={!!listings?.data?.pagination?.hasMore}
        activeListingsCount={
          listingList.filter((l) => l.status === "active" || l.status === "accepted").length
        }
        favoritesCount={favoritesCount?.count ?? 0}
      />
      {/* Orders + Listings side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Orders initialData={orderList} />
        <Listings initialData={listingList} />
      </div>
    </div>
  );
}