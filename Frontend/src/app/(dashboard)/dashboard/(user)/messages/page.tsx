import { getAuthServerData } from "@/utils/serverData";
import { ConversationsResponse } from "@/types/Chat";
import MessagesPage from "@/components/dashboard/user/messages/messagesPage";

export const revalidate = 60;
export default async function MessagesPageWrapper() {
  const initialMessages = await getAuthServerData<ConversationsResponse>("/chat/conversations"); ;  
  return (
        <MessagesPage
        initialData={
        initialMessages ? { pages: [initialMessages], pageParams: [null] } : undefined
      }/>
  );
}
