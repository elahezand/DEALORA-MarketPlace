import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ReportsResponse } from "@/types/Report";

interface UseMyReportsOptions {
  initialData?: ReportsResponse["data"];
  initialPagination?: ReportsResponse["pagination"] | null;
}

// Fetches the full (unfiltered) set of the user's reports; status filtering
// is done client-side, same pattern as the Orders dashboard page.
export const useMyReports = ({
  initialData = [],
  initialPagination = null,
}: UseMyReportsOptions = {}) => {
  return useInfiniteGet<ReportsResponse>(
    "/reports/mine",
    {},
    {
      initialData: {
        pages: [{ success: true, data: initialData, pagination: initialPagination as any }],
        pageParams: [null],
      },
    }
  );
};
