import { useAuthServerData } from "@/utils/hooks/useServerData";
import NotificationsClient from "@/app/(dashboard)/components/(admin)/notifications/NotificationsPage";
export default async function AdminNotificationsPage() {
  const initialNotifications = await useAuthServerData<any[]>(
    "/notifications",
    "admin-notifications",
    60 * 5
  );

  return (
    <NotificationsClient
      initialData={initialNotifications ?? undefined}
    />
  );
}