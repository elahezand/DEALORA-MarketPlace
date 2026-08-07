import { useAuthServerData } from "@/utils/hooks/useServerData";
import ReportsClient from "@/app/(dashboard)/components/(admin)/reports/ReportsPage";
export default async function AdminReportsPage() {
  const initialReports = await useAuthServerData<any>(
    "/reports/admin?limit=20",
    "admin-reports",
    60 * 5
  );

  return (
    <ReportsClient
   initialData={
        initialReports
          ? { pages: [initialReports], pageParams: [1] }
          : undefined
      }    />
  );
}