import { getAuthServerData } from "@/utils/serverData";
import SupportClient from "@/components/dashboard/admin/support/SupportPage";
import { ContactsResponse } from "@/types/Contact";

export const revalidate = 60;
export default async function AdminSupportPage() {
  const initialContacts = await getAuthServerData<ContactsResponse>(
    "/contacts?limit=20&status=pending",
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