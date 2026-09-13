import { InfiniteData } from "@tanstack/react-query";
import { useServerData } from "@/utils/hooks/useServerData";
import { PublicListingsResponse } from "@/types/Listings";
import NewOfferPage from "@/app/(dashboard)/components/(seller)/offers/new/NewOfferPage";

export default async function SellerNewOfferRoute() {
  const initialListings = await useServerData<PublicListingsResponse>(
    "/listings?listingType=store_product&status=active&limit=21",
    "seller-offer-default-listings",
    600
  );

  return (
    <NewOfferPage
      initialData={
        initialListings
          ? ({ pages: [initialListings], pageParams: [null] } as InfiniteData<PublicListingsResponse>)
          : undefined
      }
    />
  );
}