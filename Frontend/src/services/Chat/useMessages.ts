import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { MessagesResponse } from "@/types/Chat";
import { IPagination } from "@/types/common";

interface UseMessagesOptions {
  initialData?: MessagesResponse["data"];
  initialPagination?: IPagination | null;
}

const EMPTY_PAGINATION: IPagination = { limit: 20, nextCursor: null, hasMore: false };

export const useMessages = (
  conversationId: string,
  { initialData = [], initialPagination = null }: UseMessagesOptions = {}
) => {
  return useInfiniteGet<MessagesResponse>(
    `/chat/conversations/${conversationId}/messages`,
    {},
    {
      enabled: !!conversationId,
      initialData: conversationId
        ? {
            pages: [
              { success: true, data: initialData, pagination: initialPagination ?? EMPTY_PAGINATION },
            ],
            pageParams: [null],
          }
        : undefined,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  );
};
