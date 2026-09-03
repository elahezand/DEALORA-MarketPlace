import { useAuthServerData } from "@/utils/hooks/useServerData";
import ListingsTypeResponse from "@/types/Listings";
import ListingsPage from "../../../components/(user)/listings/listingsPage";

export default async function ListingsPageWrapper() {
  const data = await useAuthServerData<ListingsTypeResponse>("/listings/my");  
  return (
    <ListingsPage
      initialData={data?.data?.data ?? []}
      initialPagination={data?.data?.pagination}
    />
  );
}