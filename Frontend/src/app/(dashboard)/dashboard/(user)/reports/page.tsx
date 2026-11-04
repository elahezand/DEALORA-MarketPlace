import { getAuthServerData } from "@/utils/serverData";
import { ReportsResponse } from "@/types/Report";
import ReportsPage from "@/components/dashboard/user/reports/reportsPage";
export const revalidate = 60;

export default async function ReportsPageWrapper() {
  const initialReports = await getAuthServerData<ReportsResponse>("/reports/mine?status=pending");

  return (
    <ReportsPage
      initialData={
        initialReports ? { pages: [initialReports], pageParams: [null] } : undefined
      } />)
}
