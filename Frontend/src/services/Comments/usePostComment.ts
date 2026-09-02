import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface NewCommentPayload {
  listing: string;
  rating: number;
  body: string;
  title?: string;
  pros?: string[];
  cons?: string[];
  recommendation?: "recommended" | "not_recommended" | "no_idea";
  parentId?: string;
}

export function usePostComment(listingId: string) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePost<any, NewCommentPayload>("/comments", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments",listingId ] });
      toast.success("Your review was submitted and is awaiting approval.");
    },
    onError: () => {
      toast.error("Something went wrong, please try again.");
    },
  });

  return { postComment: mutate, isPosting: isPending };
}
