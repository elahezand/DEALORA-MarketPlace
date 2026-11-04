import { InfiniteData } from "@tanstack/react-query";
import { getAuthServerData } from "@/utils/serverData";
import NewOfferPage, { OfferableProductsResponse } from "@/components/dashboard/seller/offers/new/NewOfferPage";

export default async function SellerNewOfferRoute() {
  const initialListings = await getAuthServerData<OfferableProductsResponse>("/offers/products?limit=8");

  return (
    <NewOfferPage
      initialData={
        initialListings
          ? ({ pages: [initialListings], pageParams: [null] } as InfiniteData<OfferableProductsResponse>)
          : undefined
      }
    />
  );
}
