import Link from "next/link";
import Orders from "@/components/dashboard/user/index/RecentOrders";
import Listings from "@/components/dashboard/user/index/RecentListings";
import ProfileBanner from "@/components/dashboard/user/index/ProfileBanner";
import WalletCard from "@/components/dashboard/user/index/WalletCard";
import CartPreview from "@/components/dashboard/user/index/CartPreview";
import MiniCalendar from "@/components/dashboard/shared/MiniCalendar";
import { OrdersResponse } from "@/types/Order";
import MyListingsResponse from "@/types/Listings";
import { getAuthServerData } from "@/utils/serverData";



export default async function DashboardPage() {
  const [orders, listings] = await Promise.all([
    getAuthServerData<OrdersResponse>("/orders/my"),
    getAuthServerData<MyListingsResponse>("/listings/my"),
  ]);

  const orderList = orders?.data ?? [];
  const listingList = listings?.data ?? [];

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
      <WalletCard />
      {/* Orders + Listings side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Orders initialData={orderList} />
        <Listings initialData={listingList} />
      </div>
      {/* Cart preview + calendar side by side */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
        <CartPreview />
        <MiniCalendar compact />
      </div>
    </div>
  );
}