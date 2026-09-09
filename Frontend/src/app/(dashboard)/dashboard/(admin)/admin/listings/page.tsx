import { useAuthServerData } from "@/utils/hooks/useServerData";
import ListingsModerationClient from "@/app/(dashboard)/components/(admin)/listings/ListingsModerationPage";
import { PublicListingsResponse } from "@/types/Listings";

export const revalidate = 60;

export default async function Page() {
  const initialListings = await useAuthServerData<PublicListingsResponse>(
    "/listings/admin?status=pending",
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