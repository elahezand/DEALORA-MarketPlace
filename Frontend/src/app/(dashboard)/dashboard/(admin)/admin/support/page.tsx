import { useAuthServerData } from "@/utils/hooks/useServerData";
import SupportClient from "@/app/(dashboard)/components/(admin)/support/SupportPage";
export default async function AdminSupportPage() {
  const initialContacts = await useAuthServerData<any>(
    "/contacts?limit=20",
    "admin-support",
    60 * 5
  );

  return (
    <SupportClient
      initialData={
        initialContacts
          ? { pages: [initialContacts], pageParams: [1] }
          : undefined
      }
    />
  );
}