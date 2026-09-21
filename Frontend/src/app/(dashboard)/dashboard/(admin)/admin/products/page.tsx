import { useAuthServerData } from "@/utils/hooks/useServerData";
import ProductsModerationClient from "@/app/(dashboard)/components/(admin)/products/ProductsModerationPage";
import { PublicListingsResponse } from "@/types/Listings";

export const revalidate = 60;

export default async function Page() {
  const initialListings = await useAuthServerData<PublicListingsResponse>(
    "/listings/admin?listingType=store_product&status=pending",
  );

  return (
    <ProductsModerationClient
      initialData={
        initialListings
          ? { pages: [initialListings], pageParams: [null] }
          : undefined
      }
    />
  );
}