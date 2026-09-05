import { useAuthServerData } from "@/utils/hooks/useServerData";
import ListingsModerationClient from "@/app/(dashboard)/components/(admin)/listings/ListingsModerationPage";
import { PublicListingsResponse } from "@/types/Listings";

export default async function Page() {
  const initialListings = await useAuthServerData<PublicListingsResponse>(
    "/listings/admin?status=pending&limit=20",
    "listings-moderation",
    60 * 5
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