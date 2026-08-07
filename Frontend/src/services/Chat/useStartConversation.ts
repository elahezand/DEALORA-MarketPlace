import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { IConversation, IMessage, StartConversationPayload } from "@/types/Chat";
import { toast } from "sonner";

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
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Could not start the conversation, try again."
      );
    },
  });

  return { mutate, mutateAsync, ...rest };
};
