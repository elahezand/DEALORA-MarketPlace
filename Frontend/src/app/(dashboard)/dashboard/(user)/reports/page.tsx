import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ReportsResponse } from "@/types/Report";
import ReportsPage from "@/app/(dashboard)/components/(user)/reports/reportsPage";
export const revalidate = 60;

export default async function ReportsPageWrapper() {
  const initialReports = await useAuthServerData<ReportsResponse>("/reports/mine?status=pending");

  return (
    <ReportsPage
      initialData={
        initialReports ? { pages: [initialReports], pageParams: [null] } : undefined
      } />)
}
