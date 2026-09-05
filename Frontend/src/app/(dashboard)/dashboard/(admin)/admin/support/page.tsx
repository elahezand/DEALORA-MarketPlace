import { useAuthServerData } from "@/utils/hooks/useServerData";
import SupportClient from "@/app/(dashboard)/components/(admin)/support/SupportPage";
import { ContactsResponse } from "@/types/Contact";

export default async function AdminSupportPage() {
  const initialContacts = await useAuthServerData<ContactsResponse>(
    "/contacts?limit=20",
    "admin-support",
    60 * 5
  );

  return (
    <SupportClient
      initialData={
        initialContacts
          ? { pages: [initialContacts], pageParams: [null] }
          : undefined
      }
    />
  );
}