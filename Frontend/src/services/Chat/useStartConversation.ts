import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { IConversation, IMessage, StartConversationPayload } from "@/types/Chat";

interface StartConversationResponse {
  success: boolean;
  data: {
    conversation: IConversation;
    message: IMessage;
  };
}

export const useStartConversation = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, ...rest } = usePost<
    StartConversationResponse,
    StartConversationPayload
  >("/chat/conversations", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/chat/conversations"] });
    },
    errorFallback: "Could not start the conversation, try again.",
  });

  return { mutate, mutateAsync, ...rest };
};
