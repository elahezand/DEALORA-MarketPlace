import { useAuthServerData } from "@/utils/hooks/useServerData";
import UsersClient from "@/app/(dashboard)/components/(admin)/users/UsersPage";
import { AdminUsersResponse } from "@/types/User";

export default async function AdminUsersPage() {
  const initialUsers = await useAuthServerData<AdminUsersResponse>(
    "/users?limit=20",
    "admin-users",
    60 * 5
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