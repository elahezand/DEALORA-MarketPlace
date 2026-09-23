import { useAuthServerData } from "@/utils/hooks/useServerData";
import ProductsPage from "@/app/(dashboard)/components/(admin)/products/ProductsPage";
import { PublicListingsResponse } from "@/types/Listings";

export const revalidate = 60;

export default async function Page() {
  const initialProducts = await useAuthServerData<PublicListingsResponse>(
    "/listings/admin?listingType=store_product"
  );

  return (
    <ProductsPage
      initialData={
        initialProducts
          ? { pages: [initialProducts], pageParams: [undefined] } 
          : undefined
      }
    />
  );
}