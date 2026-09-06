import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ArticleMutationResponse, CreateArticlePayload } from "@/types/Article";

const ENDPOINT = "/articles";

export const useCreateArticle = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<ArticleMutationResponse, CreateArticlePayload>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Article created");
      queryClient.invalidateQueries({ queryKey: ["/articles/admin"] });
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to create article",
  });
};
