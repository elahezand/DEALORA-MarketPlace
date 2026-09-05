import { useAuthServerData } from "@/utils/hooks/useServerData";
import MyListingsResponse from "@/types/Listings";
import ListingsPage from "../../../components/(user)/listings/listingsPage";

export default async function ListingsPageWrapper() {
  const data = await useAuthServerData<MyListingsResponse>("/listings/my");  
  return (
    <ListingsPage
      initialData={data?.data?.data ?? []}
      initialPagination={data?.data?.pagination}
    />
  );
}