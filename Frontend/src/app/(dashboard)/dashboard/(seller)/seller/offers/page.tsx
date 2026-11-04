import { getAuthServerData } from "@/utils/serverData";
import { OffersResponse } from "@/types/Offer";
import OffersPage from "@/components/dashboard/seller/offers/OffersPage";

export default async function AdminOffersPage() {
  const initialOffers = await getAuthServerData<OffersResponse>(
    "/offers/me?status=pending",
  );

  return (
    <OffersPage
      initialData={
        initialOffers
          ? { pages: [initialOffers], pageParams: [undefined] }
          : undefined
      }
    />
  );
}