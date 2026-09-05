import { useAuthServerData } from "@/utils/hooks/useServerData";
import CouponsClient from "@/app/(dashboard)/components/(admin)/coupons/CouponsPage";
import { CouponsResponse } from "@/types/Coupon";

export default async function AdminCouponsPage() {
  const initialCoupons = await useAuthServerData<CouponsResponse>(
    "/coupon/admin?limit=20",
    "admin-coupons",
    60 * 5
  );

  return (
    <CouponsClient
      initialData={initialCoupons ? { pages: [initialCoupons], pageParams: [null] }
        : undefined}
    />
  );
}