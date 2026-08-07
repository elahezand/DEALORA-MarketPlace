import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ConversationsResponse } from "@/types/Chat";
import MessagesPage from "@/app/(dashboard)/components/(user)/messages/messagesPage";

export const revalidate = 0;

export default async function MessagesPageWrapper() {
  const data = await useAuthServerData<ConversationsResponse>("/chat/conversations");

  return (
    <MessagesPage
      initialData={data?.data ?? []}
      initialPagination={data?.pagination ?? null}
    />
  );
}
