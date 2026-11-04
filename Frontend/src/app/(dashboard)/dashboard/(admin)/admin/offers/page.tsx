import { getAuthServerData } from "@/utils/serverData";
import OffersClient from "@/components/dashboard/admin/offers/OffersPage";
import { OffersResponse } from "@/types/Offer";
export const revalidate = 60;

export default async function AdminOffersPage() {
  const initialOffers = await getAuthServerData<OffersResponse>(
    "/offers?status=pending",
  );

  return (
    <OffersClient
   initialData={
        initialOffers
          ? { pages: [initialOffers], pageParams: [null] }
          : undefined
      }    />
  );
}