import { useAuthServerData } from "@/utils/hooks/useServerData";
import StoresClient from "@/app/(dashboard)/components/(admin)/stores/StoresPage";
export default async function AdminStoresPage() {
  const initialStores = await useAuthServerData<any>(
    "/stores?limit=20",
    "admin-stores",
    60 * 5
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