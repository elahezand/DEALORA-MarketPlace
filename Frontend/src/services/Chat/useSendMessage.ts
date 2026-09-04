import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { IMessage, SendMessagePayload } from "@/types/Chat";

interface SendMessageResponse {
  success: boolean;
  data: IMessage;
}

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, ...rest } = usePost<
    SendMessageResponse,
    SendMessagePayload
  >(`/chat/conversations/${conversationId}/messages`, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/chat/conversations/${conversationId}/messages`],
      });
      queryClient.invalidateQueries({ queryKey: ["/chat/conversations"] });
    },
    errorFallback: "Could not send the message, try again.",
  });

  return { mutate, mutateAsync, ...rest };
};
