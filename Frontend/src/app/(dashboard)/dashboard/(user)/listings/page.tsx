import { useAuthServerData } from "@/utils/hooks/useServerData";
import MyListingsResponse from "@/types/Listings";
import ListingsPage from "../../../components/(user)/listings/listingsPage";

export const revalidate = 60;
export default async function ListingsPageWrapper() {
  const initialListings = await useAuthServerData<MyListingsResponse>("/listings/my?status=pending"); ;  
  return (
    <ListingsPage
     initialData={
        initialListings ? { pages: [initialListings], pageParams: [null] } : undefined
      }
    />
  );
}