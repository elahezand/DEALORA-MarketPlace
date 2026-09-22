import { InfiniteData } from "@tanstack/react-query";
import { useAuthServerData } from "@/utils/hooks/useServerData";
import NewOfferPage, { OfferableProductsResponse } from "@/app/(dashboard)/components/(seller)/offers/new/NewOfferPage";

export default async function SellerNewOfferRoute() {
  const initialListings = await useAuthServerData<OfferableProductsResponse>("/offers/products?limit=8");

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
