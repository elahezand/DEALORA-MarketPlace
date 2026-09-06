import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ArticleResponse } from "@/types/Article";

export const useGetArticle = (id: string) => {
  return useGet<ArticleResponse>(`/articles/${id}`, undefined, {
    queryKey: [`/articles/${id}`],
    enabled: !!id,
  });
};
