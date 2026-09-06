import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CommentItemType } from "@/types/CommetTypes";

export type NewCommentPayload = Pick<
  CommentItemType,
  "listing" | "rating" | "title" | "body" | "pros" | "cons" | "recommendation"
>; export interface NewCommentResponse {
  message: string;
  data: CommentItemType;
}

export function usePostComment(listingId: string) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePost<NewCommentResponse, NewCommentPayload>("/comments", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", listingId] });
      toast.success("Your review was submitted and is awaiting approval.");
    },
    errorFallback: "Something went wrong, please try again.",
  });

  return { postComment: mutate, isPosting: isPending };
}
