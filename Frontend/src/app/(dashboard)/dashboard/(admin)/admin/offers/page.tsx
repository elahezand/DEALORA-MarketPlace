import { useAuthServerData } from "@/utils/hooks/useServerData";
import OffersClient from "@/app/(dashboard)/components/(admin)/offers/OffersPage";
import { OffersResponse } from "@/types/Offer";
export const revalidate = 60;

export default async function AdminOffersPage() {
  const initialOffers = await useAuthServerData<OffersResponse>(
    "/offers?limit=20&status=pending",
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