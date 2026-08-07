import { useAuthServerData } from "@/utils/hooks/useServerData";
import UsersClient from "@/app/(dashboard)/components/(admin)/users/UsersPage";
export default async function AdminUsersPage() {
  const initialUsers = await useAuthServerData<any>(
    "/users?limit=20",
    "admin-users",
    60 * 5
  );

  return (
    <UsersClient
      initialData={
        initialUsers
          ? { pages: [initialUsers], pageParams: [1] }
          : undefined
      } />
  );
}