import { getAuthServerData } from "@/utils/serverData";
import ReportsClient from "@/components/dashboard/admin/reports/ReportsPage";
import { AdminReportsResponse } from "@/types/Report";

export const revalidate = 60;

export default async function AdminReportsPage() {
  const initialReports = await getAuthServerData<AdminReportsResponse>(
    "/reports/admin?status=pending",
  );

  return (
    <ReportsClient
      initialData={
        initialReports
          ? { pages: [initialReports], pageParams: [null] }
          : undefined
      } />
  );
}