import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ConversationsResponse } from "@/types/Chat";
import { IPagination } from "@/types/common";

interface UseConversationsOptions {
  initialData?: ConversationsResponse["data"];
  initialPagination?: IPagination | null;
}

const EMPTY_PAGINATION: IPagination = { limit: 20, nextCursor: null, hasMore: false };

export const useConversations = ({
  initialData = [],
  initialPagination = null,
}: UseConversationsOptions = {}) => {
  return useInfiniteGet<ConversationsResponse>(
    "/chat/conversations",
    undefined,
    {
      initialData: {
        pages: [{ success: true, data: initialData, pagination: initialPagination ?? EMPTY_PAGINATION }],
        pageParams: [null],
      },
    }
  );
};
