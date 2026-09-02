import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ConversationsResponse } from "@/types/Chat";

interface UseConversationsOptions {
  initialData?: ConversationsResponse["data"];
  initialPagination?: ConversationsResponse["pagination"] | null;
}

export const useConversations = ({
  initialData = [],
  initialPagination = null,
}: UseConversationsOptions = {}) => {
  return useInfiniteGet<ConversationsResponse>(
    "/chat/conversations",
    "conversations",
    {
      initialData: {
        pages: [{ success: true, data: initialData, pagination: initialPagination as any }],
        pageParams: [null],
      },
    }
  );
};
