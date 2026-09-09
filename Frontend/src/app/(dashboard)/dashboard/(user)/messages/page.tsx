import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ConversationsResponse } from "@/types/Chat";
import MessagesPage from "@/app/(dashboard)/components/(user)/messages/messagesPage";

export const revalidate = 60;
export default async function MessagesPageWrapper() {
  const initialMessages = await useAuthServerData<ConversationsResponse>("/chat/conversations"); ;  
  return (
        <MessagesPage
        initialData={
        initialMessages ? { pages: [initialMessages], pageParams: [null] } : undefined
      }/>
  );
}
