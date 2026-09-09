import { useAuthServerData } from "@/utils/hooks/useServerData";
import StoresClient from "@/app/(dashboard)/components/(admin)/stores/StoresPage";
import { AdminStoresResponse } from "@/types/Store";

export const revalidate = 60;

export default async function AdminStoresPage() {
  const initialStores = await useAuthServerData<AdminStoresResponse>(
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