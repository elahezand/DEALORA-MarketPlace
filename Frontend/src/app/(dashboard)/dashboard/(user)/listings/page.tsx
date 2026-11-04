import { getAuthServerData } from "@/utils/serverData";
import MyListingsResponse from "@/types/Listings";
import ListingsPage from "@/components/dashboard/user/listings/listingsPage";

export const revalidate = 60;
export default async function ListingsPageWrapper() {
  const initialListings = await getAuthServerData<MyListingsResponse>("/listings/my?status=pending"); ;  
  return (
    <ListingsPage
     initialData={
        initialListings ? { pages: [initialListings], pageParams: [null] } : undefined
      }
    />
  );
}