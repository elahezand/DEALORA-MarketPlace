import { getAuthServerData } from "@/utils/serverData";
import StoresClient from "@/components/dashboard/admin/stores/StoresPage";
import { AdminStoresResponse } from "@/types/Store";

export const revalidate = 60;

export default async function AdminStoresPage() {
  const initialStores = await getAuthServerData<AdminStoresResponse>(
    "/stores?limit=20",
  );
    

  return (
    <StoresClient
   initialData={
        initialStores
          ? { pages: [initialStores], pageParams: [null] }
          : undefined
      }    />
  );
}