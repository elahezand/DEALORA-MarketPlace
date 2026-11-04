import { getAuthServerData } from "@/utils/serverData";
import ListingsModerationClient from "@/components/dashboard/admin/listings/ListingsModerationPage";
import { PublicListingsResponse } from "@/types/Listings";

export const revalidate = 60;

export default async function Page() {
  const initialListings = await getAuthServerData<PublicListingsResponse>(
    "/listings/admin?listingType=user_ad&status=pending",

  );

  return (
    <ListingsModerationClient
      initialData={
        initialListings
          ? { pages: [initialListings], pageParams: [null] }
          : undefined
      }
    />
  );
}