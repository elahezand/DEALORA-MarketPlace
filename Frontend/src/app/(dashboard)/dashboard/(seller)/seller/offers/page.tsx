import { useAuthServerData } from "@/utils/hooks/useServerData";
import { OffersResponse } from "@/types/Offer";
import OffersPage from "@/app/(dashboard)/components/(seller)/offers/OffersPage";

export default async function AdminOffersPage() {
  const initialOffers = await useAuthServerData<OffersResponse>(
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