import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { ArticlesResponse } from "@/types/Article";

const ENDPOINT = "/articles";

export const useGetArticles = (params?: { category?: string; q?: string; limit?: number }) => {
  return useInfiniteGet<ArticlesResponse>(ENDPOINT, params, {
    queryKey: [ENDPOINT, params],
  });
};
