import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ConversationsResponse, MessagesResponse } from "@/types/Chat";
import ConversationThread from "@/app/(dashboard)/components/(user)/messages/conversationThread";

export const revalidate = 0;

export default async function ConversationPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [conversations, messages] = await Promise.all([
    useAuthServerData<ConversationsResponse>("/chat/conversations"),
    useAuthServerData<MessagesResponse>(`/chat/conversations/${id}/messages`),
  ]);

  const conversation =
    conversations?.data?.find((c) => c._id === id) ?? null;

  return (
    <ConversationThread
      conversationId={id}
      initialConversation={conversation}
      initialMessages={messages?.data ?? []}
      initialPagination={messages?.pagination ?? null}
    />
  );
}
