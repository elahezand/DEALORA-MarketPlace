import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ReportsResponse } from "@/types/Report";
import ReportsPage from "@/app/(dashboard)/components/(user)/reports/reportsPage";

export default async function ReportsPageWrapper() {
  const data = await useAuthServerData<ReportsResponse>("/reports/mine");

  return (
    <ReportsPage
      initialData={data?.data ?? []}
      initialPagination={data?.pagination ?? null}
    />
  );
}
