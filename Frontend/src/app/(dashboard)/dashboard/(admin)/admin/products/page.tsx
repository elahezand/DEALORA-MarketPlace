import { getAuthServerData } from "@/utils/serverData";
import ProductsPage from "@/components/dashboard/admin/products/ProductsPage";
import { PublicListingsResponse } from "@/types/Listings";

export const revalidate = 60;

export default async function Page() {
  const initialProducts = await getAuthServerData<PublicListingsResponse>(
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