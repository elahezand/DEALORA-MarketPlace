import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { MessagesResponse } from "@/types/Chat";

interface UseMessagesOptions {
  initialData?: MessagesResponse["data"];
  initialPagination?: MessagesResponse["pagination"] | null;
}

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
              { success: true, data: initialData, pagination: initialPagination as any },
            ],
            pageParams: [null],
          }
        : undefined,
      // Keep the thread reasonably fresh without hammering the API
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  );
};
