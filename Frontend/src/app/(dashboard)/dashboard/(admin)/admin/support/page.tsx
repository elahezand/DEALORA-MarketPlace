import { useAuthServerData } from "@/utils/hooks/useServerData";
import SupportClient from "@/app/(dashboard)/components/(admin)/support/SupportPage";
import { ContactsResponse } from "@/types/Contact";

export const revalidate = 60;
export default async function AdminSupportPage() {
  const initialContacts = await useAuthServerData<ContactsResponse>(
    "/contacts?limit=20",
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