import { useAuthServerData } from "@/utils/hooks/useServerData";
import ReportsClient from "@/app/(dashboard)/components/(admin)/reports/ReportsPage";
import { AdminReportsResponse } from "@/types/Report";

export default async function AdminReportsPage() {
  const initialReports = await useAuthServerData<AdminReportsResponse>(
    "/reports/admin?limit=20",
    "admin-reports",
    60 * 5
  );

  return (
    <ReportsClient
   initialData={
        initialReports
          ? { pages: [initialReports], pageParams: [null] }
          : undefined
      }    />
  );
}