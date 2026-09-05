import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ReportsResponse } from "@/types/Report";
import { IPagination } from "@/types/common";

interface UseMyReportsOptions {
  initialData?: ReportsResponse["data"];
  initialPagination?: IPagination | null;
}

const EMPTY_PAGINATION: IPagination = { limit: 20, nextCursor: null, hasMore: false };

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
        pages: [{ success: true, data: initialData, pagination: initialPagination ?? EMPTY_PAGINATION }],
        pageParams: [null],
      },
    }
  );
};
