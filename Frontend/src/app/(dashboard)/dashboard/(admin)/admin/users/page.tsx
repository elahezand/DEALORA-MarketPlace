import { getAuthServerData } from "@/utils/serverData";
import UsersClient from "@/components/dashboard/admin/users/UsersPage";
import { AdminUsersResponse } from "@/types/User";

export default async function AdminUsersPage() {
  const initialUsers = await getAuthServerData<AdminUsersResponse>(
    "/users?limit=20",
  );  

  return (
    <UsersClient
      initialData={
        initialUsers
          ? { pages: [initialUsers], pageParams: [null] }
          : undefined
      } />
  );
}