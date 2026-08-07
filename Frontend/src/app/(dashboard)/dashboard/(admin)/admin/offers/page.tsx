import { useAuthServerData } from "@/utils/hooks/useServerData";
import OffersClient from "@/app/(dashboard)/components/(admin)/offers/OffersPage";
export default async function AdminOffersPage() {
  const initialOffers = await useAuthServerData<any>(
    "/offers?limit=20&status=pending",
    "admin-offers-pending",
    60 * 5
  );

  return (
    <OffersClient
   initialData={
        initialOffers
          ? { pages: [initialOffers], pageParams: [1] }
          : undefined
      }    />
  );
}