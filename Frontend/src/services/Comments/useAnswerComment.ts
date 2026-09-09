import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommentItemType } from "@/types/CommetTypes";

export type AnswerCommentPayload = Pick<
  CommentItemType, "body"|"parentId"
>; export interface AnswerCommentResponse {
  message: string;
  data: CommentItemType;
}

export function useAnswerComment(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return usePost<AnswerCommentResponse, AnswerCommentPayload>(
    (d) => `/comments/${d.parentId}/answer`,
    {
      onSuccess: () => {
        toast.success("Reply posted");
        queryClient.invalidateQueries({ queryKey: ["/comments/admin"] });
        onSuccessCallback?.();
      },
      errorFallback: "Failed to post reply",
    }
  );
}