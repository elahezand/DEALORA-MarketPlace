import { useAuthServerData } from "@/utils/hooks/useServerData";
import ListingsModerationClient from "@/app/(dashboard)/components/(admin)/listings/ListingsModerationPage";
export default async function Page() {
  const initialListings = await useAuthServerData<any>(
    "/listings/moderation",
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