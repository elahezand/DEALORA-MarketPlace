import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { ConversationsResponse } from "@/types/Chat";

/**
 * Polls the conversations list and sums up the unread counter that belongs
 * to the current user, so we can show a small badge on the sidebar link.
 * Uses the same endpoint as the inbox page, so it stays in the react-query
 * cache and doesn't cost an extra request once the inbox is opened.
 */
export const useUnreadConversationsCount = () => {
  const { user } = useGetProfile();

  const { data } = useGet<ConversationsResponse>(
    "/chat/conversations",
    {},
    {
      queryKey: ["/chat/conversations", {}],
      enabled: !!user?._id,
      refetchInterval: 30000,
    }
  );

  const conversations = data?.data ?? [];

  const unreadCount = user?._id
    ? conversations.reduce((total, conversation) => {
        const mine = conversation.unreadCount?.[user._id] || 0;
        return total + mine;
      }, 0)
    : 0;

  return { unreadCount };
};
