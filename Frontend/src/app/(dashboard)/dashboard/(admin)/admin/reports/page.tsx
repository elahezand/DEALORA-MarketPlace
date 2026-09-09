import { useAuthServerData } from "@/utils/hooks/useServerData";
import ReportsClient from "@/app/(dashboard)/components/(admin)/reports/ReportsPage";
import { AdminReportsResponse } from "@/types/Report";

export const revalidate = 60;

export default async function AdminReportsPage() {
  const initialReports = await useAuthServerData<AdminReportsResponse>(
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