import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ArticleMutationResponse, UpdateArticlePayload } from "@/types/Article";

const ENDPOINT = "/articles";

export const useUpdateArticle = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePatch<ArticleMutationResponse, UpdateArticlePayload>(
    (d) => `${ENDPOINT}/${d._id}`,
    {
      onSuccess: () => {
        toast.success("Article updated");
        queryClient.invalidateQueries({ queryKey: ["/articles/admin"] });
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
        onSuccessCallback?.();
      },
      errorFallback: "Failed to update article",
    }
  );
};
