import { getAuthServerData } from "@/utils/serverData";
import CouponsClient from "@/components/dashboard/admin/coupons/CouponsPage";
import { CouponsResponse } from "@/types/Coupon";

export default async function AdminCouponsPage() {
  const initialCoupons = await getAuthServerData<CouponsResponse>(
    "/coupon/admin",
  );

  return (
    <CouponsClient
      initialData={initialCoupons ? { pages: [initialCoupons], pageParams: [null] }
        : undefined}
    />
  );
}